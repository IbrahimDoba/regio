'use client';

import React from 'react';
import { FaFileInvoice, FaCheck } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

export interface PaymentRequestData {
  id: string;
  amountGaras: number;
  amountTime: number;
  description: string;
  status: 'pending' | 'paid' | 'denied' | 'disputed';
}

interface PaymentRequestCardProps {
  data: PaymentRequestData;
  isOwn: boolean;
  onPay?: (id: string) => void;
  onDeny?: (id: string) => void;
  onDispute?: (id: string) => void;
  className?: string;
}

export function PaymentRequestCard({
  data,
  isOwn,
  onPay,
  onDeny,
  onDispute,
  className,
}: PaymentRequestCardProps) {
  const { id, amountGaras, amountTime, description, status } = data;

  const handlePay = () => onPay?.(id);
  const handleDeny = () => onDeny?.(id);
  const handleDispute = () => onDispute?.(id);

  const formatGaras = (val: number) => val.toFixed(2);
  const formatTime = (val: number) => {
    const hours = Math.floor(val / 60);
    const mins = val % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const AmountRow = () => (
    <div className="flex items-center gap-5 py-3 px-3">
      <div className="flex items-center gap-2">
        <img src="/time.png" className="w-9 h-9" alt="" />
        <span className="text-lg font-bold text-red-700">{formatTime(amountTime)}</span>
      </div>
      <div className="flex items-center gap-2">
        <img src="/garas.png" className="w-9 h-9" alt="" />
        <span className="text-lg font-bold text-red-700">{formatGaras(amountGaras)} G</span>
      </div>
    </div>
  );

  if (status === 'paid') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg overflow-hidden shadow-sm',
          'border-l-4 border-green-500',
          'min-w-[220px] max-w-[300px]',
          className
        )}
      >
        <div className="bg-green-50 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
            <FaFileInvoice className="w-3 h-3" />
            Payment Request
          </span>
          <span className="text-xs text-green-600">#{id.slice(-4)}</span>
        </div>

        <AmountRow />

        <div className="px-3 pb-2">
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>

        <div className="border-t border-gray-100 px-3 py-2 text-center">
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
        'min-w-[220px] max-w-[300px]',
        className
      )}
    >
      <div className="bg-blue-50 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
          <FaFileInvoice className="w-3 h-3" />
          Payment Request
        </span>
        <span className="text-xs text-blue-600">#{id.slice(-4)}</span>
      </div>

      <AmountRow />

      <div className="px-3 pb-2">
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>

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

      {status === 'pending' && isOwn && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="text-xs text-gray-500 text-center">
            Waiting for confirmation...
          </p>
        </div>
      )}

      {status === 'denied' && (
        <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1">
          <p className="text-xs text-red-500 text-center font-medium">
            Request declined
          </p>
          {isOwn && onDispute && (
            <button
              onClick={handleDispute}
              className={cn(
                'w-full py-1.5 text-xs font-bold',
                'text-orange-600 hover:bg-orange-50 rounded transition-colors'
              )}
            >
              Raise Dispute
            </button>
          )}
        </div>
      )}

      {status === 'disputed' && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="text-xs text-orange-500 text-center font-medium">
            Dispute under review
          </p>
        </div>
      )}
    </div>
  );
}
