'use client';

import React, { useState } from 'react';
import {
  useDisputes,
  useResolveDispute,
  type DisputePublic,
  type DisputeFilter,
} from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import ContentCard from '@/components/admin/ui/ContentCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import CaseModal from '@/components/admin/disputes/CaseModal';

type BadgeVariant = 'pending' | 'verified' | 'conflict' | 'active';

export default function AdminDisputesPage() {
  const { t } = useLanguage();
  const td = t.admin.disputes;

  const [filter, setFilter] = useState<DisputeFilter>('unresolved');
  const { data: disputes, isLoading } = useDisputes(filter);
  const resolveDisputeMutation = useResolveDispute();
  const toast = useToast();

  const [selectedDispute, setSelectedDispute] = useState<DisputePublic | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCase = (dispute: DisputePublic) => {
    setSelectedDispute(dispute);
    setIsModalOpen(true);
  };

  const handleResolveDispute = (
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    resolveDisputeMutation.mutate(
      {
        requestId,
        data: { action, reason: reason || '' },
      },
      {
        onSuccess: () => {
          toast.success(action === 'APPROVE' ? t.admin.disputes.toast_approve_success : t.admin.disputes.toast_reject_success);
        },
        onError: (error) => {
          console.error('Dispute resolution error:', error);
          toast.error(t.admin.disputes.toast_error);
        },
      }
    );
  };

  // Maps a dispute's resolution state to its status badge.
  const statusBadge = (
    resolution: DisputePublic['resolution']
  ): { variant: BadgeVariant; label: string } => {
    switch (resolution) {
      case 'APPROVED':
        return { variant: 'verified', label: td.status_approved };
      case 'CANCELLED':
        return { variant: 'pending', label: td.status_cancelled };
      default:
        return { variant: 'conflict', label: td.status_unresolved };
    }
  };

  const filterTabs: { key: DisputeFilter; label: string }[] = [
    { key: 'unresolved', label: td.filter_unresolved },
    { key: 'resolved', label: td.filter_resolved },
    { key: 'all', label: td.filter_all },
  ];

  const emptyLabel =
    filter === 'resolved'
      ? td.empty_resolved
      : filter === 'all'
        ? td.empty_all
        : td.empty;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">{td.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContentCard title={td.title}>
        {/* Filter toggle */}
        <div className="inline-flex mb-5 rounded-lg border border-[#e5e5e5] bg-[#f7f7f7] p-1">
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-[6px] px-4 rounded-md text-[13px] font-semibold transition-colors ${
                  active
                    ? 'bg-white text-[#333] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                    : 'text-[#888] hover:text-[#555]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_case_id}
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_creditor}
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_debtor}
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_reason}
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_status}
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  {td.col_controls}
                </th>
              </tr>
            </thead>
            <tbody>
              {disputes && disputes.length > 0 ? (
                disputes.map((dispute) => {
                  const badge = statusBadge(dispute.resolution);
                  const isUnresolved = dispute.resolution === 'UNRESOLVED';
                  return (
                    <tr key={dispute.request_id} className="hover:bg-[#fafafa]">
                      <td className="p-3 border-b border-[#eee]">
                        #{dispute.request_id.slice(0, 8)}
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <div>
                          <strong>{dispute.creditor_name}</strong>
                          <br />
                          <span className="text-[11px] text-[#888]">
                            {dispute.creditor_code}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <div>
                          <strong>{dispute.debtor_name}</strong>
                          <br />
                          <span className="text-[11px] text-[#888]">
                            {dispute.debtor_code}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <span className="text-[13px] text-[#666] italic">
                          &ldquo;{(dispute.dispute_reason || dispute.description)?.substring(0, 50) || 'No reason provided'}...&rdquo;
                        </span>
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <StatusBadge variant={badge.variant} label={badge.label} />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <button
                          onClick={() => handleOpenCase(dispute)}
                          className={`py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] text-white ${
                            isUnresolved ? 'bg-[#4285f4]' : 'bg-[#888]'
                          }`}
                        >
                          {isUnresolved ? td.manage_button : td.view_button}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#888]">
                    {emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Case Modal */}
      <CaseModal
        dispute={selectedDispute}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResolve={handleResolveDispute}
      />
    </>
  );
}
