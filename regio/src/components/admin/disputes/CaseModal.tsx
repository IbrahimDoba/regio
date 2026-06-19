'use client';

import React, { useState } from 'react';
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { FaXmark, FaFolderOpen, FaEnvelope, FaComments } from 'react-icons/fa6';
import { useDialog } from '@/context/DialogContext';
import { useLanguage } from '@/context/LanguageContext';

interface DisputePublic {
  request_id: string;
  debtor_code: string;
  debtor_name: string;
  creditor_code: string;
  creditor_name: string;
  amount_time: number;
  amount_regio: string;
  status: string;
  resolution: 'UNRESOLVED' | 'APPROVED' | 'CANCELLED';
  description: string | null;
  created_at: string;
  dispute_reason: string | null;
  dispute_raised_at: string | null;
  dispute_admin_note: string | null;
}

interface CaseModalProps {
  dispute: DisputePublic | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (requestId: string, action: 'APPROVE' | 'REJECT', reason?: string) => void;
}

export default function CaseModal({ dispute, isOpen, onClose, onResolve }: CaseModalProps) {
  const [consentGranted, setConsentGranted] = useState(false);
  const [reason, setReason] = useState('');
  const dialog = useDialog();
  const { t } = useLanguage();
  const cm = t.admin.disputes.case_modal;

  useModalKeyboard(onClose, undefined, isOpen && !!dispute);

  if (!isOpen || !dispute) return null;

  const isResolved = dispute.resolution !== 'UNRESOLVED';

  // Human-readable amount fragment, e.g. "15 minutes and 3.00 Garas".
  // Only includes currencies that are actually involved in the transfer.
  const amountParts: string[] = [];
  if (dispute.amount_time > 0) {
    amountParts.push(`${dispute.amount_time} ${cm.amount_time_unit}`);
  }
  if (Number(dispute.amount_regio) > 0) {
    amountParts.push(`${dispute.amount_regio} ${cm.unit_garas}`);
  }
  const amountStr = amountParts.join(` ${cm.amount_and} `);

  const debtorLabel = `${dispute.debtor_name} (${dispute.debtor_code})`;
  const creditorLabel = `${dispute.creditor_name} (${dispute.creditor_code})`;

  const handleResolve = async (action: 'APPROVE' | 'REJECT') => {
    // Spell out exactly what the action does so the admin can't act blindly.
    // APPROVE forces the transfer debtor → creditor; REJECT cancels it outright.
    const messageHtml =
      action === 'APPROVE'
        ? cm.confirm_approve_html
            .replace('{amount}', amountStr)
            .replace('{debtor}', debtorLabel)
            .replace('{creditor}', creditorLabel)
        : cm.confirm_reject_html.replace('{debtor}', debtorLabel);

    const confirmed = await dialog.confirm(cm.confirm_title, '', {
      messageHtml,
      okLabel: action === 'APPROVE' ? cm.confirm_ok_approve : cm.confirm_ok_reject,
      cancelLabel: cm.confirm_cancel,
    });
    if (!confirmed) return;
    onResolve(dispute.request_id, action, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-center">
      <div
        className="w-full bg-[rgba(160,160,160,0.38)] py-[28px] flex justify-center px-4"
        onClick={onClose}
      >
      <div
        className="bg-white rounded-lg flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-[800px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#f9f9f9] border-b border-[#eee] flex justify-between items-center">
          <h2 className="text-[20px] font-[800] text-[#333] flex items-center gap-2">
            <FaFolderOpen className="text-[#d32f2f]" />
            {cm.title.replace('{id}', dispute.request_id.slice(0, 8) + '...')}
          </h2>
          <FaXmark
            className="text-[24px] cursor-pointer text-[#999] hover:text-[#333]"
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-[30px] overflow-y-auto">
          {/* Resolution banner (resolved cases only) */}
          {isResolved && (
            <div
              className={`p-4 rounded-md mb-5 text-[14px] font-semibold border ${
                dispute.resolution === 'APPROVED'
                  ? 'bg-[#e8f5e9] border-[#c8e6c9] text-[#33691e]'
                  : 'bg-[#fff3e0] border-[#ffe0b2] text-[#e65100]'
              }`}
            >
              {dispute.resolution === 'APPROVED'
                ? cm.resolved_banner_approved
                : cm.resolved_banner_cancelled}
            </div>
          )}

          {/* Creditor Dispute Statement */}
          <div className="bg-white border border-[#eee] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#888] uppercase mb-[10px] block border-b border-[#eee] pb-[5px]">
              {cm.statement_by.replace('{name}', dispute.creditor_name)}
              {dispute.dispute_raised_at && (
                <span className="ml-2 font-normal normal-case text-[11px] text-[#aaa]">
                  — {cm.raised_suffix.replace('{date}', new Date(dispute.dispute_raised_at).toLocaleString())}
                </span>
              )}
            </span>
            <p className="text-[14px] text-[#333] leading-[1.5] italic bg-[#fff8e1] p-[10px] border-l-[3px] border-[#f9a825]">
              {dispute.dispute_reason || cm.no_dispute_reason}
            </p>
          </div>

          {/* Original Payment Request Description */}
          {dispute.description && (
            <div className="bg-white border border-[#eee] p-5 rounded-md mb-5">
              <span className="text-[12px] font-bold text-[#888] uppercase mb-[10px] block border-b border-[#eee] pb-[5px]">
                {cm.original_description_section}
              </span>
              <p className="text-[14px] text-[#333] leading-[1.5] italic bg-[#f9f9f9] p-[10px] border-l-[3px] border-[#ccc]">
                {dispute.description}
              </p>
            </div>
          )}

          {/* Case Details */}
          <div className="bg-white border border-[#eee] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#888] uppercase mb-[10px] block border-b border-[#eee] pb-[5px]">
              {cm.details_section}
            </span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-[11px] text-[#888] uppercase">{cm.creditor_label}</p>
                <p className="text-[14px] font-bold">{dispute.creditor_name}</p>
                <p className="text-[12px] text-[#666]">{dispute.creditor_code}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#888] uppercase">{cm.debtor_label}</p>
                <p className="text-[14px] font-bold">{dispute.debtor_name}</p>
                <p className="text-[12px] text-[#666]">{dispute.debtor_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <img src="/time.png" className="w-8 h-8" alt="" />
                <span className="text-[18px] font-bold text-red-700">{dispute.amount_time} min</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/garas.png" className="w-8 h-8" alt="" />
                <span className="text-[18px] font-bold text-red-700">{dispute.amount_regio} G</span>
              </div>
            </div>
          </div>

          {/* Consent Status (Mock) — only relevant while a case is open */}
          {!isResolved && (
          <div className="bg-[#f0f7ff] border border-[#bbdefb] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#4285f4] uppercase mb-[10px] block border-b border-[#bbdefb] pb-[5px]">
              {cm.consent_section}
            </span>
            <p className="text-[13px] mb-4 text-[#555]">
              {cm.consent_description}
            </p>

            <div className="flex gap-5 mb-5">
              <div className="flex-1 p-3 bg-white border border-[#eee] rounded flex items-center gap-[10px] text-[13px]">
                <div className="w-3 h-3 rounded-full bg-[#8cb348] shadow-[0_0_0_2px_#e8f5e9]"></div>
                <div>
                  <strong>{dispute.creditor_name}</strong>
                  <br />
                  <span className="text-[11px] text-[#888]">{cm.consent_granted.replace('{time}', '10:05')}</span>
                </div>
              </div>
              <div className="flex-1 p-3 bg-white border border-[#eee] rounded flex items-center gap-[10px] text-[13px]">
                <div className="w-3 h-3 rounded-full bg-[#f57c00] shadow-[0_0_0_2px_#fff3e0]"></div>
                <div>
                  <strong>{dispute.debtor_name}</strong>
                  <br />
                  <span className="text-[11px] text-[#888]">{cm.consent_waiting}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setConsentGranted(true)}
              disabled={consentGranted}
              className="w-full py-3 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center justify-center gap-[5px] bg-[#4285f4] text-white disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              <FaEnvelope />
              {consentGranted
                ? cm.consent_sent.replace('{name}', dispute.debtor_name)
                : cm.request_consent_button.replace('{name}', dispute.debtor_name)}
            </button>
          </div>
          )}

          {isResolved ? (
            /* Read-only resolution note for already-resolved cases */
            <div className="mb-2">
              <label className="block mb-2 font-bold text-[13px] text-[#555]">
                {cm.admin_note_label}
              </label>
              <p className="text-[14px] text-[#333] leading-[1.5] italic bg-[#f9f9f9] p-[10px] border-l-[3px] border-[#ccc] rounded">
                {dispute.dispute_admin_note || cm.no_admin_note}
              </p>
            </div>
          ) : (
            <>
              {/* Admin Note */}
              <div className="mb-5">
                <label className="block mb-2 font-bold text-[13px] text-[#555]">
                  {cm.resolution_label}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={cm.resolution_placeholder}
                  className="w-full p-3 border border-[#ccc] rounded text-[14px] resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div
                className={`flex gap-[10px] justify-end ${!consentGranted ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <button
                  onClick={() => handleResolve('REJECT')}
                  className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#d32f2f] text-white"
                >
                  {cm.reject_button}
                </button>
                <button
                  onClick={() => handleResolve('APPROVE')}
                  className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white"
                >
                  {cm.refund_button}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
