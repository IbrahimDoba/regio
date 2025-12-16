'use client';

import React, { useState } from 'react';
import { usePendingDisputes, useResolveDispute } from '@/lib/api';
import ContentCard from '@/components/admin/ui/ContentCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import CaseModal from '@/components/admin/disputes/CaseModal';

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

export default function AdminDisputesPage() {
  const { data: disputes, isLoading } = usePendingDisputes();
  const resolveDisputeMutation = useResolveDispute();

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
      { requestId, action, reason },
      {
        onSuccess: () => {
          alert(`Dispute ${action.toLowerCase()}d successfully!`);
        },
        onError: (error) => {
          console.error('Dispute resolution error:', error);
          alert('Failed to resolve dispute');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContentCard title="Open Conflicts">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Case ID
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Creditor (Requesting)
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Debtor (Owes)
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Reason Snippet
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Status
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Controls
                </th>
              </tr>
            </thead>
            <tbody>
              {disputes && disputes.length > 0 ? (
                disputes.map((dispute) => (
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
                        "{dispute.description?.substring(0, 50) || 'No description'}..."
                      </span>
                    </td>
                    <td className="p-3 border-b border-[#eee]">
                      <StatusBadge variant="conflict" label="Open Conflict" />
                    </td>
                    <td className="p-3 border-b border-[#eee]">
                      <button
                        onClick={() => handleOpenCase(dispute)}
                        className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#4285f4] text-white"
                      >
                        Manage Case
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#888]">
                    No pending disputes
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
