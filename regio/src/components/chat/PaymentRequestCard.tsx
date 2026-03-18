'use client';

/**
 * Payment Request Card Component
 *
 * Displays a payment request message with accept/deny actions
 * Styled like the HTML prototype payment card
 */

import React from 'react';
import { FaFileInvoice, FaCheck } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

export interface PaymentRequestData {
  id: string;
  amountRegio: number;
  amountTime: number;
  description: string;
  status: 'pending' | 'paid' | 'denied';
}

interface PaymentRequestCardProps {
  data: PaymentRequestData;
  isOwn: boolean;
  onPay?: (id: string) => void;
  onDeny?: (id: string) => void;
  className?: string;
}

export function PaymentRequestCard({
  data,
  isOwn,
  onPay,
  onDeny,
  className,
}: PaymentRequestCardProps) {
  const { id, amountRegio, amountTime, description, status } = data;

  const handlePay = () => onPay?.(id);
  const handleDeny = () => onDeny?.(id);

  // Format amounts
  const formatRegio = (val: number) => val.toFixed(2);
  const formatTime = (val: number) => {
    const hours = Math.floor(val / 60);
    const mins = val % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  if (status === 'paid') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg overflow-hidden shadow-sm',
          'border-l-4 border-green-500',
          'min-w-[200px] max-w-[280px]',
          className
        )}
      >
        {/* Header */}
        <div className="bg-green-50 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
            <FaFileInvoice className="w-3 h-3" />
            Payment Request
          </span>
          <span className="text-xs text-green-600">#{id.slice(-4)}</span>
        </div>

        {/* Body */}
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-base font-bold text-gray-800">
                {formatTime(amountTime)}
              </div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-gray-800">
                {formatRegio(amountRegio)}
              </div>
              <div className="text-xs text-gray-500">Regio</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 truncate">{description}</p>
        </div>

        {/* Paid Stamp */}
        <div className="px-3 py-2 text-center">
          <div className="inline-flex items-center gap-1 text-green-600 font-bold text-sm">
            <FaCheck className="w-4 h-4" />
            <span>Paid</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg overflow-hidden shadow-sm',
        'border-l-4 border-blue-500',
        'min-w-[200px] max-w-[280px]',
        className
      )}
    >
      {/* Header */}
      <div className="bg-blue-50 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
          <FaFileInvoice className="w-3 h-3" />
          Payment Request
        </span>
        <span className="text-xs text-blue-600">#{id.slice(-4)}</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-base font-bold text-gray-800">
              {formatTime(amountTime)}
            </div>
            <div className="text-xs text-gray-500">Time</div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-gray-800">
              {formatRegio(amountRegio)}
            </div>
            <div className="text-xs text-gray-500">Regio</div>
          </div>
        </div>
        <p className="text-xs text-gray-600 truncate">{description}</p>
      </div>

      {/* Actions */}
      {status === 'pending' && !isOwn && (
        <div className="border-t border-gray-100 flex">
          <button
            onClick={handlePay}
            className={cn(
              'flex-1 py-2.5 text-sm font-bold',
              'text-green-600 hover:bg-green-50',
              'border-r border-gray-100 transition-colors'
            )}
          >
            Pay
          </button>
          <button
            onClick={handleDeny}
            className={cn(
              'flex-1 py-2.5 text-sm font-bold',
              'text-red-500 hover:bg-red-50',
              'transition-colors'
            )}
          >
            Deny
          </button>
        </div>
      )}

      {/* Waiting state for sender */}
      {status === 'pending' && isOwn && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="text-xs text-gray-500 text-center">
            Waiting for confirmation...
          </p>
        </div>
      )}

      {/* Denied state */}
      {status === 'denied' && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="text-xs text-red-500 text-center font-medium">
            Request declined
          </p>
        </div>
      )}
    </div>
  );
}
