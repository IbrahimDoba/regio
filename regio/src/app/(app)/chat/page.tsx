"use client";

/**
 * Chat Page
 *
 * Main chat interface for direct messaging between users.
 * Features:
 * - Real-time messaging via WebSocket
 * - Payment request cards
 * - Read receipts
 * - Typing indicators
 * - File sharing (photos, location)
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  ChatHeader,
  MessageList,
  MessageInput,
  ActionSheet,
  PaymentRequestModal,
} from "@/components/chat";
import { useRealTime } from "@/context/RealTimeContext";
import { useAuth } from "@/context/AuthContext";
import { bankingApi } from "@/lib/api/modules/banking";
import { useRoomMessages } from "@/lib/api/hooks/use-chat";
import { queryKeys } from "@/lib/api/query-keys";
import { FaRegComments, FaArrowLeft } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/context/DialogContext";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const dialog = useDialog();

  // URL parameters for contextual chat
  const roomId = searchParams.get("room");
  const partnerName = searchParams.get("name") || "Chat";
  const partnerAvatar = searchParams.get("avatar");
  const listingTitle = searchParams.get("listing");
  const prefillMessage = searchParams.get("prefill") || "";
  const priceTimeParam = searchParams.get("price_time");
  const priceGarasParam = searchParams.get("price_garas");
  const listingInitialAmounts = (priceTimeParam || priceGarasParam) ? {
    time: priceTimeParam ? parseInt(priceTimeParam) : undefined,
    garas: priceGarasParam ? parseFloat(priceGarasParam) : undefined,
    description: listingTitle || "",
  } : undefined;

  const queryClient = useQueryClient();

  // Real-time context
  const {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    joinRoom,
    leaveRoom,
    sendMessage,
    uploadImage,
    sendTyping,
    getReadReceiptsForMessage,
    getTypingUsers,
    rooms,
    updatePaymentRequestStatus,
  } = useRealTime();

  // Messages from React Query cache — persists across page navigation and
  // updates instantly when RealTimeContext pushes new events via setQueryData.
  const { data: messages = [] } = useRoomMessages(roomId);
  const typingUsers = roomId ? getTypingUsers(roomId) : [];
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getApiErrorMessage = (err: unknown, fallback: string): string => {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    return axiosErr?.response?.data?.detail || (err instanceof Error ? err.message : fallback);
  };

  // Connect on mount and join room when ready
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, []);

  // Join room when connected and roomId changes
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
      
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // Handle sending a text message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!roomId) return;
      try {
        await sendMessage(roomId, content);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [roomId, sendMessage]
  );

  // Handle sending a payment request
  const handleSendPaymentRequest = useCallback(
    async (data: { amountGaras: number; amountTime: number; description: string }) => {
      if (!roomId) return;
      try {
        // Find the partner's user code to create a banking PaymentRequest
        const partnerCode = rooms.find((r) => r.roomId === roomId)?.partnerCode;
        if (!partnerCode) throw new Error("Could not find chat partner");

        // Create a banking PaymentRequest so Pay/Deny can settle funds
        const bankingRequest = await bankingApi.createPaymentRequest({
          debtor_code: partnerCode,
          amount_regio: String(data.amountGaras),
          amount_time: data.amountTime,
          description: data.description,
        });

        // Send the chat message with the banking_request_id in meta
        await sendMessage(
          roomId,
          `Payment request: ${data.amountGaras} RGD (${data.amountTime} min) - ${data.description}`,
          "payment_request",
          {
            regio_amount: data.amountGaras,
            time_amount: String(data.amountTime),
            description: data.description,
            banking_request_id: bankingRequest.id,
          }
        );
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to send payment request"));
      }
    },
    [roomId, sendMessage, rooms]
  );

  // Handle paying a payment request
  const handlePayRequest = useCallback(
    async (requestId: string) => {
      if (!roomId) return;
      try {
        await bankingApi.confirmPaymentRequest(requestId);
        updatePaymentRequestStatus(roomId, requestId, "paid");
        await sendMessage(roomId, "", "payment_status", { banking_request_id: requestId, status: "paid" });
        // Refresh wallet balance and transactions
        queryClient.invalidateQueries({ queryKey: queryKeys.banking.balance() });
        queryClient.invalidateQueries({ queryKey: queryKeys.banking.transactions.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.banking.paymentRequests.all() });
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to process payment"));
      }
    },
    [roomId, updatePaymentRequestStatus, sendMessage, queryClient]
  );

  // Handle denying a payment request
  const handleDenyRequest = useCallback(
    async (requestId: string) => {
      if (!roomId) return;
      try {
        await bankingApi.rejectPaymentRequest(requestId);
        updatePaymentRequestStatus(roomId, requestId, "denied");
        await sendMessage(roomId, "", "payment_status", { banking_request_id: requestId, status: "denied" });
        queryClient.invalidateQueries({ queryKey: queryKeys.banking.paymentRequests.all() });
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to decline request"));
      }
    },
    [roomId, updatePaymentRequestStatus, sendMessage, queryClient]
  );

  // Handle raising a dispute on a rejected payment request (creditor only)
  const handleDisputeRequest = useCallback(
    async (requestId: string) => {
      if (!roomId) return;
      const reason = await dialog.prompt(
        "Raise Dispute",
        "Optionally provide a reason for raising this dispute (max 500 chars):",
        "Reason..."
      );
      if (reason === null) return; // user cancelled
      try {
        await bankingApi.raiseDispute(requestId, { reason: reason || undefined });
        updatePaymentRequestStatus(roomId, requestId, "disputed");
        await sendMessage(roomId, "", "payment_status", { banking_request_id: requestId, status: "disputed" });
        queryClient.invalidateQueries({ queryKey: queryKeys.banking.paymentRequests.all() });
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to raise dispute"));
      }
    },
    [roomId, updatePaymentRequestStatus, sendMessage, queryClient, dialog]
  );

  // Handle photo upload — triggers hidden file input
  const handleSendPhoto = useCallback(() => {
    setIsActionSheetOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !roomId) return;
      e.target.value = "";

      if (!file.type.startsWith("image/")) {
        setActionError("Only images can be sent. Videos and other files are not supported.");
        return;
      }

      const MAX_MB = 10;
      if (file.size > MAX_MB * 1024 * 1024) {
        setActionError(`Image is too large. Maximum size is ${MAX_MB} MB.`);
        return;
      }

      try {
        await uploadImage(roomId, file);
      } catch (err) {
        // Parse Matrix JSON errors into readable messages
        let msg = "Failed to send photo";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message) as { error?: string };
            msg = parsed.error || err.message;
          } catch {
            msg = err.message;
          }
        }
        setActionError(msg);
      }
    },
    [roomId, uploadImage]
  );

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!roomId) return;
    
    // Send typing indicator
    sendTyping(roomId, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(roomId, false);
    }, 3000);
  }, [roomId, sendTyping]);

  // Get read receipts for a message
  const handleGetReadReceipts = useCallback(
    (eventId: string) => {
      if (!roomId) return [];
      return getReadReceiptsForMessage(roomId, eventId);
    },
    [roomId, getReadReceiptsForMessage]
  );

  // Clear error on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while connecting
  if (isConnecting || (!isConnected && !connectionError)) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{roomId ? t.chat.page.loading_with_room : t.chat.page.loading_no_room}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show conversations list when no room is selected
  if (!roomId) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] bg-white max-w-[480px] mx-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.chat.page.header}</h1>
            {isConnecting && (
              <p className="text-xs text-gray-400">{t.chat.page.connecting}</p>
            )}
          </div>
        </header>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <FaRegComments className="text-2xl text-green-700" />
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-2">{t.chat.page.no_conversations}</h2>
              <p className="text-sm text-gray-500">
                {t.chat.page.no_conversations_hint}
              </p>
            </div>
          ) : (
            <ul>
              {rooms.map((room) => (
                <li
                  key={room.roomId}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => {
                    const params = new URLSearchParams({ room: room.roomId, name: room.name });
                    router.push(`/chat?${params.toString()}`);
                  }}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-green-700 font-semibold text-lg">
                      {room.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-sm text-gray-900 truncate">{room.name}</span>
                      {room.lastTs && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {new Date(room.lastTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {room.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  {/* Unread badge */}
                  {room.unreadCount > 0 && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full shrink-0">
                      {room.unreadCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  const displayError = localError || connectionError;
  if (displayError) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-100">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.chat.page.error_title}</h2>
            <p className="text-gray-600 text-sm mb-4">
              {displayError || t.chat.page.error_description}
            </p>
            <button
              onClick={() => {
                setLocalError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
            >
              {t.chat.page.retry_button}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-[#e5ddd5] relative max-w-[480px] mx-auto">
      {/* Header */}
      <ChatHeader
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        listingTitle={listingTitle || undefined}
        typingUsers={typingUsers}
        onRequestPayment={listingInitialAmounts ? () => setIsPaymentModalOpen(true) : undefined}
      />

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-100 px-4 py-2 text-xs text-yellow-800 text-center">
          {t.chat.page.reconnecting}
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-red-700 flex-1">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="ml-2 text-red-400 hover:text-red-600 text-sm font-bold shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        <MessageList
          messages={messages}
          onPayRequest={handlePayRequest}
          onDenyRequest={handleDenyRequest}
          onDisputeRequest={handleDisputeRequest}
          getReadReceipts={handleGetReadReceipts}
        />
      </div>

      {/* Input Area - Sticky at bottom (above BottomNav) */}
      <div className="bg-gray-100 border-t border-gray-200 z-40">
        <div className="px-2 py-2">
          <MessageInput
            key={`${roomId}-${prefillMessage}`}
            onSend={handleSendMessage}
            onTyping={handleTyping}
            onOpenActions={() => setIsActionSheetOpen(true)}
            disabled={!isConnected || !roomId}
            initialValue={prefillMessage}
          />
        </div>
      </div>

      {/* Action Sheet */}
      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onRequestPayment={() => setIsPaymentModalOpen(true)}
        onSendPhoto={handleSendPhoto}
        onShareLocation={() => {
          setIsActionSheetOpen(false);
          if (!roomId) return;
          if (!navigator.geolocation) {
            setActionError("Geolocation is not supported by your browser");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await sendMessage(roomId, "", "location", {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Failed to send location");
              }
            },
            (err) => setActionError(`Could not get location: ${err.message}`)
          );
        }}
      />

      {/* Payment Request Modal */}
      <PaymentRequestModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleSendPaymentRequest}
        initialAmounts={listingInitialAmounts}
      />

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}
