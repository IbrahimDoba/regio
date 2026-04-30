"use client";

import React from "react";
import Link from "next/link";
import {
  FaHouse,
  FaUser,
  FaWallet,
  FaEnvelope,
  FaBell,
  FaTicket,
  FaXmark,
  FaArrowRightFromBracket,
} from "react-icons/fa6";
import { useLogout } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FaShield } from "react-icons/fa6";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { mutate: logout } = useLogout();
  const { user } = useAuth();

  const menuItems = [
    { href: "/", icon: <FaHouse />, label: "Feed" },
    { href: "/profile", icon: <FaUser />, label: "Profile" },
    { href: "/wallet", icon: <FaWallet />, label: "Wallet" },
    { href: "/chat", icon: <FaEnvelope />, label: "Messages" },
    { href: "/notifications", icon: <FaBell />, label: "Notifications" },
    { href: "/invite", icon: <FaTicket />, label: "Invite" },
    ...(user?.is_system_admin ? [{ href: "/admin", icon: <FaShield />, label: "Admin" }] : []),
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[300] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-[60px] w-full max-w-[480px] bg-white rounded-t-[20px] z-[301] shadow-2xl animate-in slide-in-from-bottom-5 duration-300" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#ddd]" />
        </div>

        {/* Close */}
        <div className="flex justify-between items-center px-5 pb-3 border-b border-[#f0f0f0]">
          <span className="text-[16px] font-[700] text-[#333]">Menu</span>
          <button onClick={onClose} className="text-[#999] text-[20px] p-1">
            <FaXmark />
          </button>
        </div>

        {/* Links */}
        <ul className="py-2">
          {menuItems.map(({ href, icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className="flex items-center gap-4 px-5 py-4 text-[15px] text-[#333] font-[500] hover:bg-[#f5f5f5] transition-colors"
              >
                <span className="text-[var(--color-nav-bg)] text-[18px] w-6 flex justify-center">
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="border-t border-[#f0f0f0] py-2 pb-6">
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-4 px-5 py-4 text-[15px] text-[#d32f2f] font-[500] hover:bg-[#fff5f5] transition-colors w-full"
          >
            <span className="text-[18px] w-6 flex justify-center">
              <FaArrowRightFromBracket />
            </span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
