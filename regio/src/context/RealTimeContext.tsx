"use client";

/**
 * RealTimeContext — Matrix SDK–based chat context.
 *
 * Maintains the same external interface as the previous WebSocket implementation
 * so that all consumer components require no changes.
 *
 * Flow:
 * 1. On mount, if Matrix credentials exist in Zustand store, re-init the SDK.
 * 2. connect() — re-initializes the Matrix client using stored credentials.
 * 3. joinRoom(roomId) — loads timeline history and marks room as active.
 * 4. sendMessage(roomId, content) — sends a Matrix text event.
 * 5. Matrix SDK events update rooms / messages / typing state.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { ChatMessage } from "@/lib/api/types";
import { useMatrixStore } from "@/store/matrixStore";
import { initializeMatrixClient, disconnectMatrixClient } from "@/lib/matrixUtils";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// ============================================================================
// Types (kept identical to the old WebSocket context for component compat)
// ============================================================================

export interface ReadReceipt {
  event_id: string;
  room_id: string;
  reader_matrix_id: string;
  read_at: number;
}

export interface ChatRoomSummary {
  roomId: string;
  name: string;
  partnerCode: string;
  lastMessage?: string;
  lastTs?: number;
  unreadCount: number;
}

export interface LocalNotification {
  id: string;
  type: "chat_message" | "system";
  title: string;
  message?: string;
  room_id?: string;
  sender_name?: string;
  is_read: boolean;
  created_at: string;
}

interface RealTimeContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  notifications: LocalNotification[];
  unreadCount: number;

  rooms: ChatRoomSummary[];
  messagesByRoom: Map<string, ChatMessage[]>;
  typingByRoom: Map<string, Set<string>>;
  readReceiptsByRoom: Map<string, Map<string, ReadReceipt[]>>;

  connect: () => Promise<void>;
  disconnect: () => void;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => void;
  createListingRoom: (
    listingId: string,
    listingTitle: string,
    sellerUserCode: string
  ) => Promise<string>;
  sendMessage: (
    roomId: string,
    content: string,
    msgType?: string,
    extraContent?: Record<string, unknown>
  ) => Promise<void>;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  sendReadReceipt: (roomId: string, eventId: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotificationForRoom: (roomId: string) => void;
  loadEarlierMessages: (roomId: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
  updatePaymentRequestStatus: (
    roomId: string,
    paymentRequestId: string,
    status: "pending" | "paid" | "denied"
  ) => void;

  getMessagesForRoom: (roomId: string) => ChatMessage[];
  getReadReceiptsForMessage: (roomId: string, eventId: string) => ReadReceipt[];
  getTypingUsers: (roomId: string) => string[];
  isUserTyping: (roomId: string, userId: string) => boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const LS_NOTIFICATIONS = "regio_notifications";

function loadLS<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : def;
  } catch {
    return def;
  }
}

function saveLS(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matrixEventToChatMessage(event: any, myUserId: string): ChatMessage | null {
  if (event.getType() !== "m.room.message") return null;
  const content = event.getContent();
  if (!content) return null;

  const msgtype = content.msgtype as string;
  if (msgtype !== "m.text" && msgtype !== "regio.payment_request") return null;

  const sender = event.getSender() as string;
  const isOwn = sender === myUserId;
  const senderName = isOwn ? "Me" : (sender.split(":")[0].replace("@", "") || sender);

  const isPayment = msgtype === "regio.payment_request";

  return {
    id: event.getId() as string,
    sender: isOwn ? "me" : sender,
    senderName,
    content: content.body as string,
    timestamp: event.getTs() as number,
    isOwn,
    type: isPayment ? "payment_request" : "text",
    paymentRequest: isPayment
      ? {
          id: (content.banking_request_id as string) || (event.getId() as string),
          amountRegio: (content.regio_amount as number) || 0,
          amountTime: parseInt(String(content.time_amount || "0"), 10),
          description: (content.description as string) || "",
          status: "pending",
        }
      : undefined,
  };
}

// ============================================================================
// Context
// ============================================================================

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const { matrixUserId, matrixAccessToken, matrixHomeserver, matrixClient, setMatrixClient } =
    useMatrixStore();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [messagesByRoom, setMessagesByRoom] = useState<Map<string, ChatMessage[]>>(new Map());
  const [typingByRoom, setTypingByRoom] = useState<Map<string, Set<string>>>(new Map());

  const currentRoomRef = useRef<string | null>(null);
  // Partner codes from the DB — Matrix SDK has no knowledge of platform user_codes
  const roomMetaRef = useRef<Map<string, { partnerCode: string; partnerName: string }>>(new Map());
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Load notifications from localStorage after mount
  useEffect(() => {
    const stored = loadLS<LocalNotification[]>(LS_NOTIFICATIONS, []);
    if (stored.length > 0) setNotifications(stored);
  }, []);

  useEffect(() => {
    saveLS(LS_NOTIFICATIONS, notifications);
  }, [notifications]);

  // ============================================================================
  // Fetch room metadata (partner codes) from our backend DB
  // ============================================================================

  const fetchRoomMeta = useCallback(async () => {
    const token = localStorage.getItem("regio_access_token");
    if (!token) return;
    try {
      const resp = await fetch(`${API_URL}/chats/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = (await resp.json()) as {
        rooms: { room_id: string; partner_code: string; partner_name: string }[];
      };
      const map = new Map<string, { partnerCode: string; partnerName: string }>();
      for (const r of data.rooms || []) {
        map.set(r.room_id, { partnerCode: r.partner_code, partnerName: r.partner_name });
      }
      roomMetaRef.current = map;
    } catch {}
  }, []);

  // ============================================================================
  // Sync rooms from SDK client
  // ============================================================================

  const syncRoomsFromClient = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client: any) => {
      if (!client) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sdkRooms: any[] = client.getRooms().filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.getMyMembership() === "join"
      );

      const summaries: ChatRoomSummary[] = sdkRooms.map((room) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timeline: any[] = room.getLiveTimeline().getEvents();
        const lastMsgEvent = [...timeline]
          .reverse()
          .find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) =>
              e.getType() === "m.room.message" &&
              e.getContent()?.msgtype === "m.text"
          );

        const meta = roomMetaRef.current.get(room.roomId as string);

        return {
          roomId: room.roomId as string,
          name: (room.name as string) || meta?.partnerName || room.roomId,
          partnerCode: meta?.partnerCode || "",
          lastMessage: lastMsgEvent
            ? (lastMsgEvent.getContent()?.body as string)
            : undefined,
          lastTs: lastMsgEvent ? (lastMsgEvent.getTs() as number) : undefined,
          unreadCount: room.getUnreadNotificationCount() as number,
        };
      });

      setRooms(summaries.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0)));
    },
    []
  );

  // ============================================================================
  // Register Matrix SDK event listeners
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachClientListeners = useCallback((client: any) => {
    if (!client) return;

    // Room.timeline — new message received
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.on("Room.timeline", (event: any, room: any, toStartOfTimeline: boolean) => {
      if (toStartOfTimeline) return; // pagination from scrollback, handled in joinRoom
      if (event.status !== null) return; // local echo — wait for server confirmation
      if (!room) return;

      // Payment status update event — not a chat message, just a state signal
      if (event.getType() === "regio.payment_status") {
        const c = event.getContent();
        const bankingId = c.banking_request_id as string;
        const newStatus = c.status as "paid" | "denied";
        if (bankingId && newStatus) {
          const roomId = room.roomId as string;
          setMessagesByRoom((prev) => {
            const newMap = new Map(prev);
            const msgs = newMap.get(roomId) || [];
            newMap.set(
              roomId,
              msgs.map((m) =>
                m.paymentRequest?.id === bankingId
                  ? { ...m, paymentRequest: { ...m.paymentRequest!, status: newStatus } }
                  : m
              )
            );
            return newMap;
          });
        }
        return;
      }

      if (event.getType() !== "m.room.message") return;
      const myId = client.getUserId() as string;
      const msg = matrixEventToChatMessage(event, myId);
      if (!msg) return;

      const roomId = room.roomId as string;

      setMessagesByRoom((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(roomId) || [];
        if (!existing.find((m) => m.id === msg.id)) {
          newMap.set(roomId, [...existing, msg]);
        }
        return newMap;
      });

      setRooms((prev) =>
        prev
          .map((r) =>
            r.roomId === roomId
              ? {
                  ...r,
                  lastMessage: msg.content,
                  lastTs: msg.timestamp,
                  unreadCount:
                    !msg.isOwn && currentRoomRef.current !== roomId
                      ? (r.unreadCount || 0) + 1
                      : r.unreadCount,
                }
              : r
          )
          .sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))
      );

      // Notification for messages from others in non-active rooms
      if (!msg.isOwn && currentRoomRef.current !== roomId) {
        const notifId = `msg-${msg.id}`;
        setNotifications((prev) => {
          if (prev.find((n) => n.id === notifId)) return prev;
          return [
            {
              id: notifId,
              type: "chat_message",
              title: `New message from ${msg.senderName}`,
              message: msg.content.substring(0, 100),
              room_id: roomId,
              sender_name: msg.senderName,
              is_read: false,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
    });

    // sync state changes
    client.on("sync", (state: string) => {
      if (state === "PREPARED" || state === "SYNCING") {
        setIsConnected(true);
        setIsConnecting(false);
        syncRoomsFromClient(client);
      } else if (state === "ERROR" || state === "STOPPED") {
        setIsConnected(false);
      }
    });

    // Typing indicators
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.on("RoomMember.typing", (_event: any, member: any) => {
      const roomId = member.roomId as string;
      const displayName = (member.name || member.userId) as string;
      const isTyping = member.typing as boolean;

      setTypingByRoom((prev) => {
        const newMap = new Map(prev);
        const current = new Set(newMap.get(roomId) || []);
        if (isTyping) {
          current.add(displayName);
        } else {
          current.delete(displayName);
        }
        newMap.set(roomId, current);
        return newMap;
      });
    });

    // Room membership changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.on("Room.myMembership", (_room: any, membership: string) => {
      if (membership === "join") {
        syncRoomsFromClient(client);
      }
    });
  }, [syncRoomsFromClient]);

  // ============================================================================
  // Connect / Disconnect
  // ============================================================================

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    const token = localStorage.getItem("regio_access_token");
    if (!token) {
      setConnectionError("Please log in to use chat");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Pre-fetch partner codes from DB before syncing rooms
      await fetchRoomMeta();

      // If we already have a client in the store, reuse it
      if (matrixClient) {
        attachClientListeners(matrixClient);
        syncRoomsFromClient(matrixClient);
        setIsConnected(true);
        setIsConnecting(false);
        return;
      }

      // If we have stored credentials, re-init SDK
      if (matrixUserId && matrixAccessToken && matrixHomeserver) {
        const client = await initializeMatrixClient(
          matrixUserId,
          matrixAccessToken,
          matrixHomeserver
        );
        attachClientListeners(client);
        syncRoomsFromClient(client);
        setIsConnected(true);
      } else {
        // No Matrix credentials yet — try to get them from the backend
        const resp = await fetch(`${API_URL}/chats/matrix/token`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          setConnectionError("Could not initialize chat. Please try again.");
          return;
        }
        const matrixData = (await resp.json()) as {
          matrix_user_id: string;
          matrix_access_token: string;
          matrix_homeserver: string;
        };
        useMatrixStore.getState().setMatrixCredentials(
          matrixData.matrix_user_id,
          matrixData.matrix_access_token,
          matrixData.matrix_homeserver
        );
        const client = await initializeMatrixClient(
          matrixData.matrix_user_id,
          matrixData.matrix_access_token,
          matrixData.matrix_homeserver
        );
        attachClientListeners(client);
        syncRoomsFromClient(client);
        setIsConnected(true);
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Failed to connect to chat");
    } finally {
      setIsConnecting(false);
    }
  }, [
    isConnected,
    isConnecting,
    matrixClient,
    matrixUserId,
    matrixAccessToken,
    matrixHomeserver,
    attachClientListeners,
    syncRoomsFromClient,
    fetchRoomMeta,
  ]);

  const disconnect = useCallback(() => {
    disconnectMatrixClient();
    setIsConnected(false);
    setIsConnecting(false);
    currentRoomRef.current = null;
  }, []);

  // ============================================================================
  // Room operations
  // ============================================================================

  const joinRoom = useCallback(
    async (roomId: string) => {
      currentRoomRef.current = roomId;

      setNotifications((prev) =>
        prev.map((n) => (n.room_id === roomId ? { ...n, is_read: true } : n))
      );
      setRooms((prev) =>
        prev.map((r) => (r.roomId === roomId ? { ...r, unreadCount: 0 } : r))
      );

      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (!client) return;

      const sdkRoom = client.getRoom(roomId);
      if (!sdkRoom) return;

      // Load scrollback (history)
      try {
        await client.scrollback(sdkRoom, 50);
      } catch {
        // ignore
      }

      // Convert existing timeline events to ChatMessage
      const myId = client.getUserId() as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events: any[] = sdkRoom.getLiveTimeline().getEvents();
      const messages: ChatMessage[] = events
        .map((e) => matrixEventToChatMessage(e, myId))
        .filter((m): m is ChatMessage => m !== null);

      // Apply payment status updates from history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const e of events) {
        if (e.getType() === "regio.payment_status") {
          const c = e.getContent();
          const bankingId = c.banking_request_id as string;
          const newStatus = c.status as "paid" | "denied";
          if (bankingId && newStatus) {
            for (const msg of messages) {
              if (msg.paymentRequest?.id === bankingId) {
                msg.paymentRequest = { ...msg.paymentRequest, status: newStatus };
              }
            }
          }
        }
      }

      setMessagesByRoom((prev) => {
        const newMap = new Map(prev);
        newMap.set(roomId, messages);
        return newMap;
      });
    },
    [matrixClient]
  );

  const leaveRoom = useCallback((roomId: string) => {
    if (currentRoomRef.current === roomId) {
      currentRoomRef.current = null;
    }
  }, []);

  const createListingRoom = useCallback(
    async (
      listingId: string,
      listingTitle: string,
      sellerUserCode: string
    ): Promise<string> => {
      const token = localStorage.getItem("regio_access_token");
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(`${API_URL}/chats/rooms/inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          listing_title: listingTitle,
          seller_user_code: sellerUserCode,
        }),
      });

      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail || "Failed to create room");
      }

      const data = (await resp.json()) as { matrix_room_id: string };
      // Refresh room meta + room list from SDK
      await fetchRoomMeta();
      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (client) syncRoomsFromClient(client);
      return data.matrix_room_id;
    },
    [matrixClient, syncRoomsFromClient, fetchRoomMeta]
  );

  // ============================================================================
  // Messaging
  // ============================================================================

  const sendMessage = useCallback(
    async (
      roomId: string,
      content: string,
      msgType: string = "text",
      extraContent?: Record<string, unknown>
    ) => {
      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (!client) throw new Error("Matrix client not connected");

      if (msgType === "payment_request" && extraContent) {
        await client.sendEvent(roomId, "m.room.message", {
          msgtype: "regio.payment_request",
          body: content,
          ...extraContent,
        });
      } else if (msgType === "payment_status" && extraContent) {
        await client.sendEvent(roomId, "regio.payment_status", {
          ...extraContent,
        });
      } else {
        await client.sendTextMessage(roomId, content);
      }
    },
    [matrixClient]
  );

  const sendTyping = useCallback(
    (roomId: string, isTyping: boolean) => {
      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (!client) return;
      client.sendTyping(roomId, isTyping, 3000).catch(() => {});
    },
    [matrixClient]
  );

  const sendReadReceipt = useCallback(
    (roomId: string, eventId: string) => {
      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (!client) return;
      const room = client.getRoom(roomId);
      if (!room) return;
      const event = room.findEventById(eventId);
      if (event) client.sendReadReceipt(event).catch(() => {});
    },
    [matrixClient]
  );

  // ============================================================================
  // Notifications
  // ============================================================================

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const clearNotificationForRoom = useCallback((roomId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.room_id === roomId ? { ...n, is_read: true } : n))
    );
  }, []);

  const loadEarlierMessages = useCallback(
    async (roomId: string) => {
      const client = matrixClient || useMatrixStore.getState().matrixClient;
      if (!client) return;
      const sdkRoom = client.getRoom(roomId);
      if (!sdkRoom) return;
      try {
        await client.scrollback(sdkRoom, 30);
        const myId = client.getUserId() as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events: any[] = sdkRoom.getLiveTimeline().getEvents();
        const messages = events
          .map((e) => matrixEventToChatMessage(e, myId))
          .filter((m): m is ChatMessage => m !== null);
        setMessagesByRoom((prev) => {
          const newMap = new Map(prev);
          newMap.set(roomId, messages);
          return newMap;
        });
      } catch {
        // ignore
      }
    },
    [matrixClient]
  );

  const refreshRooms = useCallback(async () => {
    const client = matrixClient || useMatrixStore.getState().matrixClient;
    syncRoomsFromClient(client);
  }, [matrixClient, syncRoomsFromClient]);

  const updatePaymentRequestStatus = useCallback(
    (roomId: string, paymentRequestId: string, newStatus: "pending" | "paid" | "denied") => {
      setMessagesByRoom((prev) => {
        const newMap = new Map(prev);
        const msgs = newMap.get(roomId) || [];
        newMap.set(
          roomId,
          msgs.map((m) =>
            m.paymentRequest?.id === paymentRequestId
              ? { ...m, paymentRequest: { ...m.paymentRequest!, status: newStatus } }
              : m
          )
        );
        return newMap;
      });
    },
    []
  );

  // ============================================================================
  // Getters
  // ============================================================================

  const getMessagesForRoom = useCallback(
    (roomId: string) => messagesByRoom.get(roomId) || [],
    [messagesByRoom]
  );

  const getReadReceiptsForMessage = useCallback(
    (_roomId: string, _eventId: string): ReadReceipt[] => [],
    []
  );

  const getTypingUsers = useCallback(
    (roomId: string) => Array.from(typingByRoom.get(roomId) || []),
    [typingByRoom]
  );

  const isUserTyping = useCallback(
    (roomId: string, userId: string) =>
      typingByRoom.get(roomId)?.has(userId) || false,
    [typingByRoom]
  );

  // ============================================================================
  // Auto-connect on mount
  // ============================================================================

  useEffect(() => {
    const token = localStorage.getItem("regio_access_token");
    if (token) {
      connect();
    } else {
      setConnectionError("Please log in to use chat");
    }
    return () => {
      // Don't stop the Matrix client on unmount — keep it running globally
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RealTimeContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectionError,
        notifications,
        unreadCount,
        rooms,
        messagesByRoom,
        typingByRoom,
        readReceiptsByRoom: new Map(),
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        createListingRoom,
        sendMessage,
        sendTyping,
        sendReadReceipt,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotificationForRoom,
        loadEarlierMessages,
        refreshRooms,
        updatePaymentRequestStatus,
        getMessagesForRoom,
        getReadReceiptsForMessage,
        getTypingUsers,
        isUserTyping,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error("useRealTime must be used within RealTimeProvider");
  }
  return context;
}
