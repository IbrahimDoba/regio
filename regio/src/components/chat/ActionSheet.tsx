'use client';

/**
 * Action Sheet Component
 *
 * Bottom sheet modal for chat actions
 * (Request Payment, Send Photo, Share Location)
 */

import React, { useEffect } from 'react';
import {
  FaImage,
  FaLocationDot,
  FaMoneyBillTransfer,
  FaXmark,
} from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPayment: () => void;
  onSendPayment?: () => void;
  onSendPhoto?: () => void;
  onShareLocation?: () => void;
}

export function ActionSheet({
  isOpen,
  onClose,
  onRequestPayment,
  onSendPayment,
  onSendPhoto,
  onShareLocation,
}: ActionSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      <div
        className="w-full bg-[rgba(160,160,160,0.38)] pb-[60px] pt-[6px] flex justify-center px-4"
        onClick={onClose}
      >
      <div
        className={cn(
          'w-full max-w-[480px] bg-white rounded-t-2xl',
          'p-5 animate-slide-up shadow-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-800 mb-4">{t.chat.action_sheet.title}</h3>

        <div className="space-y-1">
          <ActionItem
            icon={<img src="/requestpayment.png" className="w-5 h-5" alt="" />}
            label={t.chat.action_sheet.request_payment}
            onClick={() => {
              onClose();
              onRequestPayment();
            }}
          />
          <ActionItem
            icon={<FaMoneyBillTransfer className="w-5 h-5" />}
            label={t.chat.action_sheet.send_payment}
            onClick={() => {
              onClose();
              onSendPayment?.();
            }}
          />
          <ActionItem
            icon={<FaImage className="w-5 h-5" />}
            label={t.chat.action_sheet.send_photo}
            onClick={() => {
              onClose();
              onSendPhoto?.();
            }}
          />
          <ActionItem
            icon={<FaLocationDot className="w-5 h-5" />}
            label={t.chat.action_sheet.share_location}
            onClick={() => {
              onClose();
              onShareLocation?.();
            }}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-lg transition-colors"
        >
          {t.chat.action_sheet.cancel}
        </button>
      </div>
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

/**
 * Action Item Component
 */
interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionItem({ icon, label, onClick }: ActionItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 py-3 px-2',
        'border-b border-gray-100 last:border-0',
        'text-gray-700 hover:bg-gray-50 rounded-lg transition-colors'
      )}
    >
      <span className="text-green-700 w-8 flex justify-center">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
