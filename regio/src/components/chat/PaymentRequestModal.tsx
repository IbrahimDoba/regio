'use client';

/**
 * Payment Request Modal Component
 *
 * Modal for creating a new payment request
 * Allows entering Garas amount, Time amount, and description
 */

import React, { useState, useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amountGaras: number;
    amountTime: number;
    description: string;
  }) => void;
}

export function PaymentRequestModal({
  isOpen,
  onClose,
  onSubmit,
}: PaymentRequestModalProps) {
  const { t } = useLanguage();
  const [amountGaras, setAmountGaras] = useState('');
  const [amountTime, setAmountTime] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to avoid sync setState warning
      requestAnimationFrame(() => {
        setAmountGaras('');
        setAmountTime('');
        setDescription('');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amountGaras: parseFloat(amountGaras) || 0,
      amountTime: parseInt(amountTime) || 0,
      description: description || 'Payment Request',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-black/50 backdrop-blur-sm pb-[60px]"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[480px] bg-white rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{t.chat.payment_request_modal.title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Amount Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                {t.chat.payment_request_modal.garas_label}
              </label>
              <div className="flex items-center gap-2">
                <img src="/garas.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountGaras}
                  onChange={(e) => setAmountGaras(e.target.value)}
                  placeholder={t.chat.payment_request_modal.garas_placeholder}
                  className={cn(
                    'flex-1 min-w-0 px-4 py-3 bg-white border border-gray-300 rounded-lg',
                    'text-base text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                {t.chat.payment_request_modal.time_label}
              </label>
              <div className="flex items-center gap-2">
                <img src="/time.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                <input
                  type="number"
                  min="0"
                  value={amountTime}
                  onChange={(e) => setAmountTime(e.target.value)}
                  placeholder={t.chat.payment_request_modal.time_placeholder}
                  className={cn(
                    'flex-1 min-w-0 px-4 py-3 bg-white border border-gray-300 rounded-lg',
                    'text-base text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              {t.chat.payment_request_modal.description_label}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.chat.payment_request_modal.description_placeholder}
              className={cn(
                'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg',
                'text-base text-gray-900 placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={cn(
              'w-full py-3.5 bg-blue-500 hover:bg-blue-600',
              'text-white font-bold rounded-lg',
              'transition-colors shadow-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={!amountGaras && !amountTime}
          >
            {t.chat.payment_request_modal.submit_button}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
