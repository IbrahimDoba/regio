'use client';

/**
 * Message Input Component
 *
 * Chat input area with plus button, text input, and send button
 * Handles text entry, action sheet trigger, and typing indicators
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaPaperPlane } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: () => void;
  onOpenActions: () => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  onOpenActions,
  disabled = false,
  placeholder,
  initialValue = '',
}: MessageInputProps) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t.chat.message_input.placeholder;
  const [message, setMessage] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasTypedRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSend(message.trim());
    setMessage('');
    hasTypedRef.current = false;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator on first keystroke
    if (!hasTypedRef.current && onTyping && e.target.value.length > 0) {
      onTyping();
      hasTypedRef.current = true;
    }
    
    // Reset typing flag when message is cleared
    if (e.target.value.length === 0) {
      hasTypedRef.current = false;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-end gap-2'
      )}
    >
      {/* Plus Button */}
      <button
        type="button"
        onClick={onOpenActions}
        disabled={disabled}
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full',
          'bg-white text-gray-600 shadow-sm',
          'flex items-center justify-center',
          'hover:bg-gray-50 active:scale-95',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <FaPlus className="w-5 h-5" />
      </button>

      {/* Input Wrapper */}
      <div className="flex-1 bg-white rounded-full shadow-sm px-4 py-2 flex items-center">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none',
            'text-sm text-gray-900 placeholder-gray-400',
            'min-h-[20px] max-h-[100px]',
            'disabled:opacity-50'
          )}
        />
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full',
          'bg-green-800 text-white shadow-md',
          'flex items-center justify-center',
          'hover:bg-green-700 active:scale-95',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <FaPaperPlane className="w-4 h-4" />
      </button>
    </form>
  );
}
