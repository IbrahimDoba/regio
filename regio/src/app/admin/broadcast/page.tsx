'use client';

import React, { useState } from 'react';
import ContentCard from '@/components/admin/ui/ContentCard';
import { FaPaperPlane } from 'react-icons/fa6';
import { useSendBroadcast } from '@/lib/api/hooks/use-broadcasts';
import { useLanguage } from '@/context/LanguageContext';

const AUDIENCE_TO_TRUST_LEVELS: Record<string, string[]> = {
  ALL: ['ALL'],
  VERIFIED: ['VERIFIED'],
  PENDING: ['PENDING'],
  T1_T2: ['T1', 'T2'],
  T5_T6: ['T5', 'T6'],
};

export default function AdminBroadcastPage() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { mutate: sendBroadcast, isPending } = useSendBroadcast();

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      setFeedback({ type: 'error', message: t.admin.broadcast.error_fill_fields });
      return;
    }

    setFeedback(null);
    sendBroadcast(
      {
        trust_levels: AUDIENCE_TO_TRUST_LEVELS[targetAudience] ?? ['ALL'],
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || null,
      },
      {
        onSuccess: () => {
          setFeedback({ type: 'success', message: t.admin.broadcast.success.replace('{audience}', targetAudience) });
          setTitle('');
          setBody('');
          setLink('');
          setTargetAudience('ALL');
        },
        onError: () => {
          setFeedback({ type: 'error', message: t.admin.broadcast.error_failed });
        },
      }
    );
  };

  return (
    <div className="max-w-[700px]">
      <ContentCard title={t.admin.broadcast.card_title}>
        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            {t.admin.broadcast.title_label}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Server Maintenance"
            className="w-full p-[10px] border border-[#ccc] rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            {t.admin.broadcast.body_label}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t.admin.broadcast.body_placeholder}
            className="w-full p-[10px] border border-[#ccc] rounded resize-none"
            rows={8}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            {t.admin.broadcast.link_label}
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full p-[10px] border border-[#ccc] rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            {t.admin.broadcast.audience_label}
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full p-[10px] border border-[#ccc] rounded"
          >
            <option value="ALL">{t.admin.broadcast.audience_all}</option>
            <option value="VERIFIED">{t.admin.broadcast.audience_verified}</option>
            <option value="PENDING">{t.admin.broadcast.audience_pending}</option>
            <option value="T1_T2">{t.admin.broadcast.audience_t1_t2}</option>
            <option value="T5_T6">{t.admin.broadcast.audience_t5_t6}</option>
          </select>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded text-[13px] ${
              feedback.type === 'success'
                ? 'bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32]'
                : 'bg-[#ffebee] border border-[#ef9a9a] text-[#c62828]'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          onClick={handleSendBroadcast}
          disabled={isPending}
          className="w-full py-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center justify-center gap-[5px] bg-[#8cb348] text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FaPaperPlane />
          {isPending ? t.admin.broadcast.sending : t.admin.broadcast.send_button}
        </button>

        <div className="mt-5 p-4 bg-[#f0f7ff] border border-[#bbdefb] rounded">
          <p className="text-[12px] text-[#555]">
            <strong>{t.admin.broadcast.note_label}</strong> {t.admin.broadcast.note_body}
          </p>
        </div>
      </ContentCard>
    </div>
  );
}
