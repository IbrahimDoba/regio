'use client';

/**
 * Message List Component
 *
 * Displays chat messages with date separators, system notices, and read receipts
 * Handles scrolling and message rendering
 */

import React, { useRef, useEffect } from 'react';
import { FaLock, FaCheck, FaCheckDouble, FaEye } from 'react-icons/fa6';
import { PaymentRequestCard } from './PaymentRequestCard';
import type { ChatMessage } from '@/lib/api/types';
import type { ReadReceipt } from '@/context/RealTimeContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  className?: string;
  onPayRequest?: (id: string) => void;
  onDenyRequest?: (id: string) => void;
  getReadReceipts?: (eventId: string) => ReadReceipt[];
}

/**
 * Format timestamp to display time
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date for date separators
 */
function formatDate(timestamp: number, todayLabel: string, yesterdayLabel: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return todayLabel;
  if (date.toDateString() === yesterday.toDateString()) return yesterdayLabel;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Group messages by date
 */
function groupMessagesByDate(messages: ChatMessage[]): Map<string, ChatMessage[]> {
  const groups = new Map<string, ChatMessage[]>();

  messages.forEach((message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(message);
  });

  return groups;
}

export function MessageList({
  messages,
  currentUserId,
  className,
  onPayRequest,
  onDenyRequest,
  getReadReceipts,
}: MessageListProps) {
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      ref={containerRef}
      className={cn(
        'px-4 py-4 min-h-full',
        'flex flex-col gap-3',
        className
      )}
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=1000&auto=format&fit=crop")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      }}
    >
      {/* System Notice */}
      <div className="flex justify-center mb-4">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
          <FaLock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">
            {t.chat.message_list.encrypted_notice}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-gray-500 text-sm text-center">
            {t.chat.message_list.empty}
          </p>
        </div>
      )}

      {/* Messages grouped by date */}
      {Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
        <div key={date} className="flex flex-col gap-3">
          {/* Date Separator */}
          <div className="flex justify-center my-2">
            <div className="bg-green-100/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-semibold text-gray-600">
                {formatDate(dateMessages[0].timestamp, t.chat.message_list.today, t.chat.message_list.yesterday)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          {dateMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onPayRequest={onPayRequest}
              onDenyRequest={onDenyRequest}
              readReceipts={getReadReceipts ? getReadReceipts(message.id) : []}
            />
          ))}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

/**
 * Individual Message Item
 */
interface MessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  onPayRequest?: (id: string) => void;
  onDenyRequest?: (id: string) => void;
  readReceipts?: ReadReceipt[];
}

function MessageItem({
  message,
  currentUserId,
  onPayRequest,
  onDenyRequest,
  readReceipts = [],
}: MessageItemProps) {
  const isOwn = message.isOwn;
  const hasReadReceipts = readReceipts.length > 0;

  // Payment request message
  if (message.type === 'payment_request' && message.paymentRequest) {
    return (
      <div
        className={cn(
          'flex',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <div className="flex flex-col items-end gap-1">
          <PaymentRequestCard
            data={message.paymentRequest}
            isOwn={isOwn}
            onPay={onPayRequest}
            onDeny={onDenyRequest}
          />
          <MessageTime 
            timestamp={message.timestamp} 
            isOwn={isOwn} 
            readReceipts={readReceipts}
          />
        </div>
      </div>
    );
  }

  // Text message
  return (
    <div
      className={cn(
        'flex',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] px-3 py-2 rounded-lg shadow-sm',
          'text-sm leading-relaxed',
          isOwn
            ? 'bg-[#e1ffc7] text-gray-900 rounded-tr-none'
            : 'bg-white text-gray-900 rounded-tl-none'
        )}
      >
        <p>{message.content}</p>
        <MessageTime 
          timestamp={message.timestamp} 
          isOwn={isOwn} 
          readReceipts={readReceipts}
        />
      </div>
    </div>
  );
}

/**
 * Message Time Component with Read Receipts
 */
interface MessageTimeProps {
  timestamp: number;
  isOwn: boolean;
  readReceipts?: ReadReceipt[];
}

function MessageTime({ timestamp, isOwn, readReceipts = [] }: MessageTimeProps) {
  const hasReadReceipts = readReceipts.length > 0;
  
  return (
    <div
      className={cn(
        'flex items-center gap-1 mt-1',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <span className={cn(
        'text-[10px]',
        isOwn ? 'text-green-700' : 'text-gray-400'
      )}>
        {formatTime(timestamp)}
      </span>
      
      {/* Read receipt indicator (only for own messages) */}
      {isOwn && (
        <ReadReceiptIndicator readReceipts={readReceipts} />
      )}
    </div>
  );
}

/**
 * Read Receipt Indicator
 * Shows single check for sent, double check for delivered, 
 * colored double check for read
 */
interface ReadReceiptIndicatorProps {
  readReceipts: ReadReceipt[];
}

function ReadReceiptIndicator({ readReceipts }: ReadReceiptIndicatorProps) {
  const hasReadReceipts = readReceipts.length > 0;
  
  if (hasReadReceipts) {
    // Message has been read - show colored double check
    return (
      <div className="flex items-center gap-0.5" title={`Read by ${readReceipts.length} user(s)`}>
        <FaCheckDouble className="w-3 h-3 text-sky-500" />
        {readReceipts.length > 1 && (
          <span className="text-[8px] text-sky-500 ml-0.5">
            {readReceipts.length}
          </span>
        )}
      </div>
    );
  }
  
  // Message delivered but not read - show gray double check
  // For now, we assume delivered if no error
  return (
    <FaCheckDouble 
      className="w-3 h-3 text-gray-400" 
      title="Delivered"
    />
  );
}
