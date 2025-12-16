'use client';

/**
 * Error Message Component
 *
 * Displays error messages in a styled banner
 * Used for form validation errors and API errors
 */

import React from 'react';
import { FaCircleExclamation } from 'react-icons/fa6';

interface ErrorMessageProps {
  message: string | null | undefined;
  className?: string;
}

export default function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`bg-[#ffebee] border-l-[3px] border-[#d32f2f] p-[12px] text-[13px] text-[#c62828] rounded-[4px] leading-[1.4] animate-in slide-in-from-top-2 duration-200 ${className}`}
      role="alert"
    >
      <FaCircleExclamation className="inline mr-[6px] text-[14px]" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
