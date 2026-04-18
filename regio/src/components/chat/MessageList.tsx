'use client';

/**
 * Message List Component
 *
 * Displays chat messages with date separators, system notices, and read receipts
 * Handles scrolling and message rendering
 */

import React, { useRef, useEffect, useState } from 'react';
import { FaLock, FaCheck, FaCheckDouble, FaEye, FaLocationDot } from 'react-icons/fa6';
import { PaymentRequestCard } from './PaymentRequestCard';
import type { ChatMessage } from '@/lib/api/types';
import type { ReadReceipt } from '@/context/RealTimeContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useMatrixStore } from '@/store/matrixStore';

const MATRIX_HS = (process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL || 'https://matrix.151.hu').replace(/\/$/, '');

function mxcToDownloadUrl(mxcUrl: string): string {
  if (!mxcUrl?.startsWith('mxc://')) return mxcUrl || '';
  // Matrix 1.11+ authenticated media endpoint
  return `${MATRIX_HS}/_matrix/client/v1/media/download/${mxcUrl.slice(6)}`;
}

/**
 * Fetches a Matrix media URL with the access token and renders it via a blob URL.
 * Falls back to unauthenticated direct URL if the fetch fails.
 */
function ChatImage({ mxcUrl, alt, className, onClick }: {
  mxcUrl: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const { matrixAccessToken } = useMatrixStore();

  useEffect(() => {
    if (!mxcUrl) return;
    const downloadUrl = mxcToDownloadUrl(mxcUrl);
    let objectUrl: string | null = null;

    fetch(downloadUrl, {
      headers: matrixAccessToken ? { Authorization: `Bearer ${matrixAccessToken}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        // Fall back to direct URL (works on servers without authenticated media)
        setSrc(downloadUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mxcUrl, matrixAccessToken]);

  if (!src) {
    return (
      <div className="w-[240px] h-[160px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onClick={onClick} />;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  className?: string;
  onPayRequest?: (id: string) => void;
  onDenyRequest?: (id: string) => void;
  onDisputeRequest?: (id: string) => void;
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
  onDisputeRequest,
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
              onDisputeRequest={onDisputeRequest}
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
  onDisputeRequest?: (id: string) => void;
  readReceipts?: ReadReceipt[];
}

function MessageItem({
  message,
  currentUserId,
  onPayRequest,
  onDenyRequest,
  onDisputeRequest,
  readReceipts = [],
}: MessageItemProps) {
  const isOwn = message.isOwn;
  const hasReadReceipts = readReceipts.length > 0;

  // Location message
  if (message.type === 'location' && message.location) {
    const { lat, lng } = message.location;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex flex-col items-end gap-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'overflow-hidden rounded-lg shadow-sm block',
              isOwn ? 'rounded-tr-none' : 'rounded-tl-none'
            )}
          >
            <div className="w-[220px] bg-white">
              <div className="bg-green-50 px-3 py-2 flex items-center gap-2">
                <FaLocationDot className="text-green-600 text-sm shrink-0" />
                <span className="text-sm font-semibold text-green-700">Shared Location</span>
              </div>
              <div className="px-3 py-1.5 text-xs text-gray-500">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
              <div className="px-3 pb-2 text-xs text-blue-500 font-medium">
                Open in Maps →
              </div>
            </div>
          </a>
          <MessageTime timestamp={message.timestamp} isOwn={isOwn} readReceipts={readReceipts} />
        </div>
      </div>
    );
  }

  // Image message
  if (message.type === 'image' && message.imageUrl) {
    const openFull = () => window.open(mxcToDownloadUrl(message.imageUrl!), '_blank');
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex flex-col items-end gap-1">
          <div
            className={cn(
              'overflow-hidden rounded-lg shadow-sm cursor-pointer',
              isOwn ? 'rounded-tr-none' : 'rounded-tl-none'
            )}
            onClick={openFull}
          >
            <ChatImage
              mxcUrl={message.imageUrl}
              alt={message.content || 'Image'}
              className="max-w-[240px] max-h-[320px] object-cover block"
            />
          </div>
          <MessageTime timestamp={message.timestamp} isOwn={isOwn} readReceipts={readReceipts} />
        </div>
      </div>
    );
  }

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
            onDispute={onDisputeRequest}
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
