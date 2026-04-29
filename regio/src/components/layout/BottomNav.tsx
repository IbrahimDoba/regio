"use client";

import React from "react";
import { FaBell, FaWallet, FaBars } from "react-icons/fa6";
import { FaRegEnvelope, FaRegSquarePlus } from "react-icons/fa6";
import { useRealTime } from "@/context/RealTimeContext";

interface BottomNavProps {
  onOpenCreate: () => void;
  onOpenMenu: () => void;
}

export default function BottomNav({ onOpenCreate, onOpenMenu }: BottomNavProps) {
  const { unreadCount, rooms } = useRealTime();
  const totalUnreadMessages = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-[var(--color-nav-bg)] h-[60px] flex justify-around items-center text-white z-[200]">
      {/* Notifications with Badge */}
      <div 
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity relative"
        onClick={() => window.location.href = '/notifications'}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-[calc(50%-16px)] bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      
      {/* Messages with unread badge */}
      <div
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity relative"
        onClick={() => window.location.href = '/chat'}
      >
        <FaRegEnvelope />
        {totalUnreadMessages > 0 && (
          <span className="absolute top-2 right-[calc(50%-16px)] bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
          </span>
        )}
      </div>
      
      {/* Wallet */}
      <div 
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity"
        onClick={() => window.location.href = '/wallet'}
      >
        <FaWallet />
      </div>
      
      {/* Create */}
      <div 
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity"
        onClick={onOpenCreate}
      >
        <FaRegSquarePlus />
      </div>
      
      {/* Menu */}
      <div
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity"
        onClick={onOpenMenu}
      >
        <FaBars />
      </div>
    </nav>
  );
}
