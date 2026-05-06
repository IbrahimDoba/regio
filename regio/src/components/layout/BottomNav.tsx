"use client";

import React from "react";
import { FaBell, FaWallet, FaBars } from "react-icons/fa6";
import { FaRegEnvelope, FaRegSquarePlus } from "react-icons/fa6";
import { useRealTime } from "@/context/RealTimeContext";
import { useLanguage } from "@/context/LanguageContext";

interface BottomNavProps {
  onOpenCreate: () => void;
  onOpenMenu: () => void;
}

function NavItem({
  children,
  tooltip,
  onClick,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <div
      className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity relative group"
      onClick={onClick}
    >
      {children}
      <span className="absolute bottom-full mb-[6px] left-1/2 -translate-x-1/2 bg-black/75 text-white text-[11px] px-[8px] py-[4px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
        {tooltip}
      </span>
    </div>
  );
}

export default function BottomNav({ onOpenCreate, onOpenMenu }: BottomNavProps) {
  const { unreadCount, rooms } = useRealTime();
  const { t } = useLanguage();
  const totalUnreadMessages = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-[var(--color-nav-bg)] h-[60px] flex justify-around items-center text-white z-[200]">
      {/* Notifications */}
      <NavItem tooltip={t.nav.notifications} onClick={() => window.location.href = '/notifications'}>
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-[calc(50%-16px)] bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </NavItem>

      {/* Messages */}
      <NavItem tooltip={t.nav.messages} onClick={() => window.location.href = '/chat'}>
        <FaRegEnvelope />
        {totalUnreadMessages > 0 && (
          <span className="absolute top-2 right-[calc(50%-16px)] bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
          </span>
        )}
      </NavItem>

      {/* Wallet */}
      <NavItem tooltip={t.nav.wallet} onClick={() => window.location.href = '/wallet'}>
        <FaWallet />
      </NavItem>

      {/* Create */}
      <NavItem tooltip={t.nav.create} onClick={onOpenCreate}>
        <FaRegSquarePlus />
      </NavItem>

      {/* Menu */}
      <NavItem tooltip={t.nav.menu} onClick={onOpenMenu}>
        <FaBars />
      </NavItem>
    </nav>
  );
}
