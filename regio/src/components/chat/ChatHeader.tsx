'use client';

/**
 * Chat Header Component
 *
 * Displays the chat partner info, avatar, typing indicators, and listing context
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaEllipsisVertical, FaReply } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  partnerName: string;
  partnerAvatar?: string | null;
  listingTitle?: string;
  typingUsers?: string[];
  onBack?: () => void;
  className?: string;
}

export function ChatHeader({
  partnerName,
  partnerAvatar,
  listingTitle,
  typingUsers = [],
  onBack,
  className,
}: ChatHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Format typing indicator text
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers.length} people are typing...`;
  };

  const typingText = getTypingText();

  return (
    <header
      className={cn(
        'bg-white border-b border-gray-100 sticky top-0 z-50',
        'px-4 py-3 flex items-center gap-3',
        'shadow-sm',
        className
      )}
    >
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Go back"
      >
        <FaArrowLeft className="w-5 h-5" />
      </button>

      {/* Partner Info */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={partnerAvatar || `https://i.pravatar.cc/100?u=${partnerName}`}
            alt={partnerName}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {partnerName}
          </h2>
          {typingText ? (
            <p className="text-xs text-green-600 italic animate-pulse">
              {typingText}
            </p>
          ) : listingTitle ? (
            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
              <FaReply className="w-3 h-3 rotate-180" />
              <span>Re: {listingTitle}</span>
            </p>
          ) : (
            <p className="text-xs text-green-600">Online</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <button
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="More options"
      >
        <FaEllipsisVertical className="w-5 h-5" />
      </button>
    </header>
  );
}
