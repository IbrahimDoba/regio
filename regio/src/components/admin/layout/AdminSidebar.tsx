'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FaUsers, FaTags, FaGavel, FaBullhorn } from 'react-icons/fa6';
import Image from 'next/image';

const navItems = [
  { id: 'users',     icon: FaUsers,    labelKey: 'user_management', href: '/admin/users' },
  { id: 'tags',      icon: FaTags,     labelKey: 'tag_management',  href: '/admin/tags' },
  { id: 'disputes',  icon: FaGavel,    labelKey: 'disputes',        href: '/admin/disputes' },
  { id: 'broadcast', icon: FaBullhorn, labelKey: 'broadcasts',      href: '/admin/broadcast' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="w-[260px] bg-[#1a3b15] text-[#e0e0e0] flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
      {/* Brand */}
      <div className="p-5 border-b border-[rgba(255,255,255,0.1)] flex items-center gap-[10px]">
        <div className="bg-white rounded-[6px] px-[6px] py-[3px]">
          <Image src="/logo-S.png" alt="REGIO" width={80} height={29} />
        </div>
        <span className="text-[13px] font-bold text-[#8cb348] uppercase tracking-widest">{t.admin.sidebar.brand}</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const label = t.admin.sidebar[item.labelKey as keyof typeof t.admin.sidebar];

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                p-[15px_20px] cursor-pointer flex items-center gap-3
                text-[15px] font-medium transition-all
                hover:bg-[rgba(255,255,255,0.05)] hover:text-white
                ${isActive ? 'bg-[#2e5c25] text-white border-r-4 border-[#8cb348]' : ''}
              `}
            >
              <Icon className="text-[18px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-5 border-t border-[rgba(255,255,255,0.1)] flex items-center gap-[10px] text-[14px]">
        <img
          src={user?.avatar_url || 'https://i.pravatar.cc/100?img=33'}
          alt="Admin"
          className="w-8 h-8 rounded-full"
        />
        <div>
          <div className="font-bold">{user ? `${user.first_name} ${user.last_name}` : 'Admin'}</div>
          <div className="text-[11px] opacity-70">{t.admin.sidebar.super_admin}</div>
        </div>
      </div>
    </div>
  );
}
