'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FaShieldHalved, FaUsers, FaTags, FaGavel, FaBullhorn } from 'react-icons/fa6';

const navItems = [
  {
    id: 'users',
    icon: FaUsers,
    labelKey: 'adminUsers',
    href: '/admin/users',
  },
  {
    id: 'tags',
    icon: FaTags,
    labelKey: 'adminTags',
    href: '/admin/tags',
  },
  {
    id: 'disputes',
    icon: FaGavel,
    labelKey: 'adminDisputes',
    href: '/admin/disputes',
  },
  {
    id: 'broadcast',
    icon: FaBullhorn,
    labelKey: 'adminBroadcast',
    href: '/admin/broadcast',
  },
];

// Temporary translations - will be added to LanguageContext later
const adminTranslations = {
  GB: {
    adminUsers: 'User Management',
    adminTags: 'Tag Management',
    adminDisputes: 'Disputes',
    adminBroadcast: 'Broadcasts',
    superAdmin: 'Super Admin',
  },
  DE: {
    adminUsers: 'Benutzerverwaltung',
    adminTags: 'Tag-Verwaltung',
    adminDisputes: 'Konflikte',
    adminBroadcast: 'Rundruf',
    superAdmin: 'Super Admin',
  },
  HU: {
    adminUsers: 'Felhasználók',
    adminTags: 'Címkék',
    adminDisputes: 'Viták',
    adminBroadcast: 'Körlevél',
    superAdmin: 'Szuper Admin',
  },
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = adminTranslations[language];

  return (
    <div className="w-[260px] bg-[#1a3b15] text-[#e0e0e0] flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
      {/* Brand */}
      <div className="p-5 text-[24px] font-[900] text-white tracking-[-1px] border-b border-[rgba(255,255,255,0.1)] flex items-center gap-[10px]">
        <FaShieldHalved className="text-[#8cb348]" />
        <span>ADMIN</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                p-[15px_20px] cursor-pointer flex items-center gap-3
                text-[15px] font-medium transition-all
                hover:bg-[rgba(255,255,255,0.05)] hover:text-white
                ${
                  isActive
                    ? 'bg-[#2e5c25] text-white border-r-4 border-[#8cb348]'
                    : ''
                }
              `}
            >
              <Icon className="text-[18px]" />
              <span>{t[item.labelKey as keyof typeof t]}</span>
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
          <div className="font-bold">{user?.full_name || 'Admin'}</div>
          <div className="text-[11px] opacity-70">{t.superAdmin}</div>
        </div>
      </div>
    </div>
  );
}
