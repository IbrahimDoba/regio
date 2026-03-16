"use client";

/**
 * RealTimeContext — WebSocket-based chat context.
 *
 * Flow:
 * 1. connect() → validates auth token, fetches room list from REST
 * 2. joinRoom(roomId) → fetches message history via REST, opens WebSocket
 * 3. WS receives messages and typing events, updates state
 * 4. leaveRoom(roomId) → closes WebSocket
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

// ============================================================================
// Types
// ============================================================================

// Kept for component compatibility — always an empty array in the WS implementation
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
// Constants
// ============================================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const LS_NOTIFICATIONS = "regio_notifications";

// ============================================================================
// Helpers
// ============================================================================

function getWsUrl(roomId: string, token: string): string {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}/chats/ws/${roomId}?token=${encodeURIComponent(token)}`;
}

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
function serverMsgToChatMessage(msg: Record<string, any>): ChatMessage {
  // Normalize legacy "regio.payment_request" msgtype to "payment_request"
  const rawType = (msg.message_type as string) || "text";
  const normalizedType = rawType.replace("regio.", "");

  let type: "text" | "payment_request" | "system" = "text";
  if (normalizedType === "payment_request") type = "payment_request";
  else if (normalizedType === "offer_accept" || normalizedType === "offer_reject")
    type = "system";

  return {
    id: msg.id,
    sender: msg.is_own ? "me" : (msg.sender_name as string),
    senderName: msg.is_own ? "Me" : (msg.sender_name as string),
    content: msg.content as string,
    timestamp: new Date(msg.created_at as string).getTime(),
    isOwn: Boolean(msg.is_own),
    type,
    paymentRequest:
      type === "payment_request" && msg.meta
        ? {
            id: (msg.meta.banking_request_id as string) || (msg.id as string),
            amountRegio: (msg.meta.regio_amount as number) || 0,
            amountTime: parseInt(String(msg.meta.time_amount || "0"), 10),
            description: (msg.meta.description as string) || "",
            status: (msg.meta.payment_status as "pending" | "paid" | "denied") || "pending",
          }
        : undefined,
  };
}

// ============================================================================
// Context
// ============================================================================

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [messagesByRoom, setMessagesByRoom] = useState<
    Map<string, ChatMessage[]>
  >(new Map());
  const [typingByRoom, setTypingByRoom] = useState<Map<string, Set<string>>>(
    new Map()
  );

  const wsRef = useRef<WebSocket | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isConnectingRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Load notifications from localStorage after mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    const stored = loadLS<LocalNotification[]>(LS_NOTIFICATIONS, []);
    if (stored.length > 0) {
      setNotifications(stored);
    }
  }, []);

  useEffect(() => {
    saveLS(LS_NOTIFICATIONS, notifications);
  }, [notifications]);

  // ============================================================================
  // Fetch rooms list via REST
  // ============================================================================

  const fetchRooms = useCallback(async () => {
    const token = localStorage.getItem("regio_access_token");
    if (!token) return;
    try {
      const resp = await fetch(`${API_URL}/chats/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = (await resp.json()) as {
        rooms: {
          room_id: string;
          listing_title: string;
          partner_name: string;
          partner_code: string;
          last_message?: string | null;
          last_ts?: number | null;
          unread_count?: number;
        }[];
      };
      setRooms(
        (data.rooms || []).map((r) => ({
          roomId: r.room_id,
          name: r.listing_title || r.partner_name,
          partnerCode: r.partner_code,
          lastMessage: r.last_message ?? undefined,
          lastTs: r.last_ts ?? undefined,
          unreadCount: r.unread_count || 0,
        }))
      );
    } catch {}
  }, []);

  const refreshRooms = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  // ============================================================================
  // Connect — validate auth, fetch rooms
  // ============================================================================

  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) return;
    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    const token = localStorage.getItem("regio_access_token");
    if (!token) {
      setConnectionError("Please log in to use chat");
      setIsConnecting(false);
      isConnectingRef.current = false;
      return;
    }

    try {
      await fetchRooms();
      setIsConnected(true);
    } catch (err) {
      setConnectionError(
        err instanceof Error ? err.message : "Failed to connect"
      );
    } finally {
      setIsConnecting(false);
      isConnectingRef.current = false;
    }
  }, [isConnected, fetchRooms]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    setIsConnected(false);
    setIsConnecting(false);
    currentRoomRef.current = null;
    isConnectingRef.current = false;
  }, []);

  // ============================================================================
  // WebSocket management (one WS per open room)
  // ============================================================================

  const openWs = useCallback((roomId: string) => {
    const token = localStorage.getItem("regio_access_token");
    if (!token) return;

    // Close existing WS before opening a new one
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(getWsUrl(roomId, token));
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = 1000; // reset backoff on successful connect
    };

    ws.onmessage = (event) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(event.data) as Record<string, any>;

        if (data.event === "typing") {
          setTypingByRoom((prev) => {
            const newMap = new Map(prev);
            const current = new Set(newMap.get(roomId) || []);
            if (data.is_typing) {
              current.add(data.sender_name as string);
            } else {
              current.delete(data.sender_name as string);
            }
            newMap.set(roomId, current);
            return newMap;
          });
          return;
        }

        if (data.event === "message") {
          const msg = serverMsgToChatMessage(data);

          setMessagesByRoom((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(roomId) || [];
            if (!existing.find((m) => m.id === msg.id)) {
              newMap.set(roomId, [...existing, msg]);
            }
            return newMap;
          });

          // Keep room list sorted with latest message on top
          // Also increment unread count for messages from others in non-active rooms
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

          // Create notification if not currently viewing this room
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
        }
      } catch {}
    };

    ws.onerror = () => {
      // onclose will fire after onerror, reconnect handled there
    };

    ws.onclose = () => {
      // Reconnect only if we're still supposed to be in this room
      if (currentRoomRef.current === roomId) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            30000
          );
          openWs(roomId);
        }, reconnectDelayRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Room operations
  // ============================================================================

  const joinRoom = useCallback(
    async (roomId: string) => {
      currentRoomRef.current = roomId;

      // Mark notifications for this room as read
      setNotifications((prev) =>
        prev.map((n) => (n.room_id === roomId ? { ...n, is_read: true } : n))
      );

      // Reset unread count for this room
      setRooms((prev) =>
        prev.map((r) => (r.roomId === roomId ? { ...r, unreadCount: 0 } : r))
      );

      // Fetch message history
      const token = localStorage.getItem("regio_access_token");
      if (token) {
        try {
          const resp = await fetch(
            `${API_URL}/chats/rooms/${roomId}/messages?limit=50`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (resp.ok) {
            const data = (await resp.json()) as {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              messages: Record<string, any>[];
            };
            const messages = (data.messages || []).map(
              serverMsgToChatMessage
            );
            setMessagesByRoom((prev) => {
              const newMap = new Map(prev);
              newMap.set(roomId, messages);
              return newMap;
            });
          }
        } catch {}
      }

      // Open WebSocket for real-time updates
      openWs(roomId);
    },
    [openWs]
  );

  const leaveRoom = useCallback((roomId: string) => {
    if (currentRoomRef.current === roomId) {
      currentRoomRef.current = null;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
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
        const err = (await resp.json().catch(() => ({}))) as {
          detail?: string;
        };
        throw new Error(err.detail || "Failed to create room");
      }

      const data = (await resp.json()) as { room_id: string };
      await fetchRooms();
      return data.room_id;
    },
    [fetchRooms]
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
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Not connected to chat");
      }
      wsRef.current.send(
        JSON.stringify({
          type: msgType,
          content,
          meta: extraContent || null,
        })
      );
    },
    []
  );

  const sendTyping = useCallback((_roomId: string, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
  }, []);

  // Read receipts are handled server-side; no-op here
  const sendReadReceipt = useCallback(
    (_roomId: string, _eventId: string) => {},
    []
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

  // Pagination placeholder — can extend later
  const loadEarlierMessages = useCallback(async (_roomId: string) => {}, []);

  const updatePaymentRequestStatus = useCallback(
    (roomId: string, paymentRequestId: string, status: "pending" | "paid" | "denied") => {
      setMessagesByRoom((prev) => {
        const newMap = new Map(prev);
        const msgs = newMap.get(roomId) || [];
        newMap.set(
          roomId,
          msgs.map((m) =>
            m.paymentRequest?.id === paymentRequestId
              ? { ...m, paymentRequest: { ...m.paymentRequest!, status } }
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
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
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
