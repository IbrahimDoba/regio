"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaBullhorn, FaCoins, FaClock, FaUserPlus, FaArrowLeft } from "react-icons/fa6";
import { FaRegComments, FaRegBellSlash, FaMessage } from "react-icons/fa6";
import { useRealTime, type LocalNotification } from "@/context/RealTimeContext";

// Icon mapping based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "chat_message":
      return { icon: <FaRegComments />, className: "bg-[#e3f2fd] text-[#1e88e5]" };
    case "payment_request":
    case "payment_received":
      return { icon: <FaCoins />, className: "bg-[#e8f5e9] text-[var(--color-green-offer)]" };
    case "system":
      return { icon: <FaBullhorn />, className: "bg-[#fff3e0] text-[#f57c00]" };
    case "reminder":
      return { icon: <FaClock />, className: "bg-[#ffebee] text-[#d32f2f]" };
    case "invite":
      return { icon: <FaUserPlus />, className: "bg-[#e0f2f1] text-[#009688]" };
    default:
      return { icon: <FaMessage />, className: "bg-[#f5f5f5] text-[#666]" };
  }
};

// Format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useRealTime();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.is_read;
    return true;
  });

  // Separate into inbox (chat) and activity (other) for display
  const inboxItems = filteredNotifications.filter(
    (item) => item.type === "chat_message"
  );
  const activityItems = filteredNotifications.filter(
    (item) => item.type !== "chat_message"
  );

  // Handle notification click
  const handleNotificationClick = async (item: LocalNotification) => {
    // Mark as read
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
    }

    // Navigate based on type
    if (item.room_id) {
      // It's a chat notification - navigate to chat
      const params = new URLSearchParams({
        room: item.room_id,
        name: item.sender_name || "Chat",
      });
      router.push(`/chat?${params.toString()}`);
    }
    // Add more navigation logic for other notification types as needed
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    setIsLoading(true);
    await markAllNotificationsAsRead();
    setIsLoading(false);
  };

  // Render notification item
  const renderNotificationItem = (item: LocalNotification) => {
    const { icon, className } = getNotificationIcon(item.type);
    const isUnread = !item.is_read;

    return (
      <li
        key={item.id}
        className={`flex gap-[15px] p-[15px] border-b border-[#f5f5f5] cursor-pointer transition-colors relative hover:bg-[#fafafa] ${
          isUnread ? "bg-[#f0f7e6]" : "bg-white"
        }`}
        onClick={() => handleNotificationClick(item)}
      >
        <div className={`w-[40px] h-[40px] rounded-full flex justify-center items-center text-[18px] shrink-0 ${className}`}>
          {icon}
        </div>
        <div className="flex-grow flex flex-col justify-center">
          <div className="text-[14px] font-[600] text-[#222] mb-[3px]">{item.title}</div>
          <div className="text-[13px] text-[#666] leading-[1.3] line-clamp-2">{item.message}</div>
          <div className="flex justify-between items-center mt-[6px] text-[11px] text-[#999]">
            <span className="capitalize">{item.type.replace("_", " ")}</span>
            <span>{formatRelativeTime(item.created_at)}</span>
          </div>
        </div>
        {isUnread && (
          <div className="absolute top-[15px] right-[15px] w-[8px] h-[8px] rounded-full bg-[var(--color-green-offer)]"></div>
        )}
      </li>
    );
  };

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <button
              onClick={() => router.back()}
              className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <FaBell className="text-[var(--color-nav-bg)]" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-[var(--color-green-offer)] text-white text-[12px] font-[600] px-[8px] py-[2px] rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="text-[12px] text-[var(--color-green-offer)] font-[600] cursor-pointer disabled:opacity-50"
              onClick={handleMarkAllRead}
              disabled={isLoading}
            >
              {isLoading ? "..." : "Mark all read"}
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0] bg-white">
        <div
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${
            activeTab === "all"
              ? "text-[var(--color-green-offer)] border-[var(--color-green-offer)]"
              : "border-transparent hover:bg-[#f9f9f9]"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All ({notifications.length})
        </div>
        <div
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${
            activeTab === "unread"
              ? "text-[var(--color-green-offer)] border-[var(--color-green-offer)]"
              : "border-transparent hover:bg-[#f9f9f9]"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Unread ({unreadCount})
        </div>
      </div>

      {/* List Content */}
      <div className="flex-grow overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center p-[40px_20px] text-[#999]">
            <FaRegBellSlash className="text-[40px] mb-[10px] opacity-30 mx-auto" />
            <p>No notifications.</p>
          </div>
        ) : (
          <>
            {/* Chat Notifications Section */}
            {inboxItems.length > 0 && (
              <>
                <div className="px-[15px] py-[10px] bg-[#f5f5f5] text-[12px] font-[600] text-[#666] uppercase tracking-wide">
                  Messages
                </div>
                <ul className="list-none p-0">{inboxItems.map(renderNotificationItem)}</ul>
              </>
            )}

            {/* Activity Section */}
            {activityItems.length > 0 && (
              <>
                <div className="px-[15px] py-[10px] bg-[#f5f5f5] text-[12px] font-[600] text-[#666] uppercase tracking-wide">
                  Activity
                </div>
                <ul className="list-none p-0">{activityItems.map(renderNotificationItem)}</ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
