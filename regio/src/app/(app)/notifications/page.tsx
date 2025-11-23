"use client";

import React, { useState } from "react";
import { FaBell, FaBullhorn, FaCoins, FaClock, FaUserPlus } from "react-icons/fa6";
import { FaRegComments, FaRegBellSlash } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationsPage() {
  const { t } = useLanguage(); // We might need to add translations later, for now using hardcoded english/mock
  const [activeTab, setActiveTab] = useState<'inbox' | 'activity'>('inbox');

  const inboxItems = [
    {
      id: 1,
      type: 'system',
      icon: <FaBullhorn />,
      iconClass: 'bg-[#fff3e0] text-[#f57c00]',
      title: 'Community Update',
      text: 'Maintenance scheduled for Sunday night. We are upgrading our servers for better performance.',
      meta1: 'Admin Team',
      meta2: '2 hrs ago',
      unread: true,
      link: '#'
    },
    {
      id: 2,
      type: 'chat',
      icon: <FaRegComments />,
      iconClass: 'bg-[#e3f2fd] text-[#1e88e5]',
      title: 'Eva Kovacs',
      text: 'Hi! Thanks for accepting. Where should I pick you up exactly?',
      meta1: 'Re: Trip to Airport',
      meta2: '14:30',
      unread: true,
      link: '#'
    },
    {
      id: 3,
      type: 'chat',
      icon: <FaRegComments />,
      iconClass: 'bg-[#e3f2fd] text-[#1e88e5]',
      title: 'John Myers',
      text: 'Perfect, see you on Saturday then.',
      meta1: 'Re: Help with Tech',
      meta2: 'Yesterday',
      unread: false,
      link: '#'
    }
  ];

  const activityItems = [
    {
      id: 4,
      type: 'pay',
      icon: <FaCoins />,
      iconClass: 'bg-[#e8f5e9] text-[var(--color-green-offer)]',
      title: 'Payment Received',
      text: 'Maria sent you <strong>12.00 R + 15 min</strong> for Homemade Honey.',
      meta1: 'Wallet',
      meta2: '15 mins ago',
      unread: true,
      link: '/wallet'
    },
    {
      id: 5,
      type: 'alert',
      icon: <FaClock />,
      iconClass: 'bg-[#ffebee] text-[#d32f2f]',
      title: 'Reminder: Open Request',
      text: 'Please confirm payment to Peter Müller. Auto-execution in 24h.',
      meta1: 'Wallet',
      meta2: 'Yesterday',
      unread: false,
      link: '/wallet'
    },
    {
      id: 6,
      type: 'system',
      icon: <FaUserPlus />,
      iconClass: 'bg-[#e0f2f1] text-[#009688]',
      title: 'Friend Joined!',
      text: 'Your invite code was used by Sarah J. You earned +1 Reputation Point.',
      meta1: 'Community',
      meta2: '2 days ago',
      unread: false,
      link: '#'
    }
  ];

  const markAllRead = () => {
    alert("All notifications marked as read.");
  };

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px] flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaBell className="text-[var(--color-nav-bg)]" /> Notifications
          </div>
          <div className="text-[12px] text-[var(--color-green-offer)] font-[600] cursor-pointer" onClick={markAllRead}>
            Mark all read
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0] bg-white">
        <div 
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === 'inbox' ? 'text-[var(--color-green-offer)] border-[var(--color-green-offer)]' : 'border-transparent hover:bg-[#f9f9f9]'}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox (2)
        </div>
        <div 
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === 'activity' ? 'text-[var(--color-green-offer)] border-[var(--color-green-offer)]' : 'border-transparent hover:bg-[#f9f9f9]'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </div>
      </div>

      {/* List Content */}
      <div className="flex-grow overflow-y-auto">
        <ul className="list-none p-0">
          {(activeTab === 'inbox' ? inboxItems : activityItems).map(item => (
            <li 
              key={item.id}
              className={`flex gap-[15px] p-[15px] border-b border-[#f5f5f5] cursor-pointer transition-colors relative hover:bg-[#fafafa] ${item.unread ? 'bg-[#f0f7e6]' : 'bg-white'}`}
              onClick={() => window.location.href = item.link}
            >
              <div className={`w-[40px] h-[40px] rounded-full flex justify-center items-center text-[18px] shrink-0 ${item.iconClass}`}>
                {item.icon}
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="text-[14px] font-[600] text-[#222] mb-[3px]">{item.title}</div>
                <div className="text-[13px] text-[#666] leading-[1.3] line-clamp-2" dangerouslySetInnerHTML={{ __html: item.text }}></div>
                <div className="flex justify-between items-center mt-[6px] text-[11px] text-[#999]">
                  <span>{item.meta1}</span>
                  <span>{item.meta2}</span>
                </div>
              </div>
              {item.unread && (
                <div className="absolute top-[15px] right-[15px] w-[8px] h-[8px] rounded-full bg-[var(--color-green-offer)]"></div>
              )}
            </li>
          ))}
        </ul>

        {/* Empty State (Hidden by default logic but good to have) */}
        {((activeTab === 'inbox' && inboxItems.length === 0) || (activeTab === 'activity' && activityItems.length === 0)) && (
          <div className="text-center p-[40px_20px] text-[#999]">
            <FaRegBellSlash className="text-[40px] mb-[10px] opacity-30 mx-auto" />
            <p>No new notifications.</p>
          </div>
        )}
      </div>

    </div>
  );
}
