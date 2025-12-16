'use client';

import React, { useState } from 'react';
import { FaXmark, FaFolderOpen, FaEnvelope, FaComments } from 'react-icons/fa6';

interface DisputePublic {
  request_id: string;
  debtor_code: string;
  debtor_name: string;
  creditor_code: string;
  creditor_name: string;
  amount_time: number;
  amount_regio: string;
  status: string;
  description: string | null;
  created_at: string;
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

  if (!isOpen || !dispute) return null;

  const handleResolve = (action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action} this dispute?`)) return;
    onResolve(dispute.request_id, action, reason);
    onClose();
  };

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.5)] z-[1000] flex justify-center items-center backdrop-blur-[3px]"
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
            Case: {dispute.request_id.slice(0, 8)}... - Dispute
          </h2>
          <FaXmark
            className="text-[24px] cursor-pointer text-[#999] hover:text-[#333]"
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-[30px] overflow-y-auto">
          {/* Creditor Statement */}
          <div className="bg-white border border-[#eee] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#888] uppercase mb-[10px] block border-b border-[#eee] pb-[5px]">
              Statement by {dispute.creditor_name} (Creditor)
            </span>
            <p className="text-[14px] text-[#333] leading-[1.5] italic bg-[#f9f9f9] p-[10px] border-l-[3px] border-[#ccc]">
              {dispute.description || 'No description provided'}
            </p>
          </div>

          {/* Case Details */}
          <div className="bg-white border border-[#eee] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#888] uppercase mb-[10px] block border-b border-[#eee] pb-[5px]">
              Case Details
            </span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-[11px] text-[#888] uppercase">Creditor (Requesting)</p>
                <p className="text-[14px] font-bold">{dispute.creditor_name}</p>
                <p className="text-[12px] text-[#666]">{dispute.creditor_code}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#888] uppercase">Debtor (Owes)</p>
                <p className="text-[14px] font-bold">{dispute.debtor_name}</p>
                <p className="text-[12px] text-[#666]">{dispute.debtor_code}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#888] uppercase">Amount (Time)</p>
                <p className="text-[14px] font-bold">{dispute.amount_time} minutes</p>
              </div>
              <div>
                <p className="text-[11px] text-[#888] uppercase">Amount (Regio)</p>
                <p className="text-[14px] font-bold">{dispute.amount_regio} ℛ</p>
              </div>
            </div>
          </div>

          {/* Consent Status (Mock) */}
          <div className="bg-[#f0f7ff] border border-[#bbdefb] p-5 rounded-md mb-5">
            <span className="text-[12px] font-bold text-[#4285f4] uppercase mb-[10px] block border-b border-[#bbdefb] pb-[5px]">
              Arbitration Consent Status
            </span>
            <p className="text-[13px] mb-4 text-[#555]">
              To view the private chat history and intervene, we need active consent from both
              parties to lift E2E privacy for this case.
            </p>

            <div className="flex gap-5 mb-5">
              <div className="flex-1 p-3 bg-white border border-[#eee] rounded flex items-center gap-[10px] text-[13px]">
                <div className="w-3 h-3 rounded-full bg-[#8cb348] shadow-[0_0_0_2px_#e8f5e9]"></div>
                <div>
                  <strong>{dispute.creditor_name}</strong>
                  <br />
                  <span className="text-[11px] text-[#888]">Granted: Today, 10:05</span>
                </div>
              </div>
              <div className="flex-1 p-3 bg-white border border-[#eee] rounded flex items-center gap-[10px] text-[13px]">
                <div className="w-3 h-3 rounded-full bg-[#f57c00] shadow-[0_0_0_2px_#fff3e0]"></div>
                <div>
                  <strong>{dispute.debtor_name}</strong>
                  <br />
                  <span className="text-[11px] text-[#888]">Waiting for response...</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setConsentGranted(true)}
              disabled={consentGranted}
              className="w-full py-3 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center justify-center gap-[5px] bg-[#4285f4] text-white disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              <FaEnvelope />
              {consentGranted ? 'Request Sent to ' + dispute.debtor_name : 'Request Consent & Info from ' + dispute.debtor_name}
            </button>
          </div>

          {/* Admin Note */}
          <div className="mb-5">
            <label className="block mb-2 font-bold text-[13px] text-[#555]">
              Admin Resolution Note (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for your decision..."
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
              Reject Claim
            </button>
            <button
              onClick={() => handleResolve('APPROVE')}
              className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white"
            >
              Issue Refund (Force)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
