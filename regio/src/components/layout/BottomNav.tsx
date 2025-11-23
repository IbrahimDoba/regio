"use client";

import React from "react";
import { FaBell, FaWallet, FaBars } from "react-icons/fa6";
import { FaRegEnvelope, FaRegSquarePlus } from "react-icons/fa6";

interface BottomNavProps {
  onOpenCreate: () => void;
}

export default function BottomNav({ onOpenCreate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-[var(--color-nav-bg)] h-[60px] flex justify-around items-center text-white z-200">
      <div className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity" onClick={() => window.location.href = '/notifications'}>
        <FaBell />
      </div>
      <div className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity">
        <FaRegEnvelope />
      </div>
      <div className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity" onClick={() => window.location.href = '/wallet'}>
        <FaWallet />
      </div>
      <div 
        className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity"
        onClick={onOpenCreate}
      >
        <FaRegSquarePlus />
      </div>
      <div className="nav-item flex flex-col items-center justify-center text-[22px] cursor-pointer opacity-80 w-full h-full hover:opacity-100 transition-opacity">
        <FaBars />
      </div>
    </nav>
  );
}
