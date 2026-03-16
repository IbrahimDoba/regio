"use client";

/**
 * ChatToast — shows a popup when a new chat message arrives.
 *
 * Watches the notifications list. When a new unread chat_message
 * notification appears, shows a dismissable toast at the top of the screen
 * for 4 seconds. Clicking it navigates to the chat room.
 */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaRegComments, FaXmark } from "react-icons/fa6";
import { useRealTime, type LocalNotification } from "@/context/RealTimeContext";

interface ToastState {
  notification: LocalNotification;
  visible: boolean;
}

export default function ChatToast() {
  const router = useRouter();
  const { notifications } = useRealTime();
  const [toast, setToast] = useState<ToastState | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Find the most recent unread chat_message we haven't shown yet
    const latest = notifications.find(
      (n) => n.type === "chat_message" && !n.is_read && !seenIds.current.has(n.id)
    );

    if (!latest) return;

    seenIds.current.add(latest.id);

    // Clear any existing dismiss timer
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    setToast({ notification: latest, visible: true });

    // Auto-dismiss after 4 seconds
    dismissTimer.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
      dismissTimer.current = setTimeout(() => setToast(null), 300);
    }, 4000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [notifications]);

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
    dismissTimer.current = setTimeout(() => setToast(null), 300);
  };

  const handleClick = () => {
    if (!toast) return;
    const { room_id, sender_name } = toast.notification;
    dismiss();
    if (room_id) {
      const params = new URLSearchParams({
        room: room_id,
        name: sender_name || "Chat",
      });
      router.push(`/chat?${params.toString()}`);
    }
  };

  if (!toast) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
        w-[calc(100%-32px)] max-w-[440px]
        transition-all duration-300 ease-out
        ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >
      <div
        className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 cursor-pointer"
        onClick={handleClick}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <FaRegComments className="text-green-700 text-lg" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {toast.notification.sender_name || "New message"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {toast.notification.message || "Sent you a message"}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <FaXmark className="text-sm" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-1 mx-1 h-0.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{
            animation: toast.visible ? "shrink 4s linear forwards" : "none",
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
