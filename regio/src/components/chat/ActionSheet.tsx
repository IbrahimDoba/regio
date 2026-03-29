'use client';

/**
 * Action Sheet Component
 *
 * Bottom sheet modal for chat actions
 * (Request Payment, Send Photo, Share Location)
 */

import React, { useEffect } from 'react';
import {
  FaHandHoldingDollar,
  FaImage,
  FaLocationDot,
  FaXmark,
} from 'react-icons/fa6';
import { cn } from '@/lib/utils';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPayment: () => void;
  onSendPhoto?: () => void;
  onShareLocation?: () => void;
}

export function ActionSheet({
  isOpen,
  onClose,
  onRequestPayment,
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-black/50 backdrop-blur-sm pb-[60px]"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'w-full max-w-[480px] bg-white rounded-t-2xl',
          'p-5 animate-slide-up shadow-2xl'
        )}
      >
        <h3 className="font-bold text-gray-800 mb-4">Actions</h3>

        <div className="space-y-1">
          <ActionItem
            icon={<FaHandHoldingDollar className="w-5 h-5" />}
            label="Request Payment"
            onClick={() => {
              onClose();
              onRequestPayment();
            }}
          />
          <ActionItem
            icon={<FaImage className="w-5 h-5" />}
            label="Send Photo"
            onClick={() => {
              onClose();
              onSendPhoto?.();
            }}
          />
          <ActionItem
            icon={<FaLocationDot className="w-5 h-5" />}
            label="Share Location"
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
          Cancel
        </button>
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
