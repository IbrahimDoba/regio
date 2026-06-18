'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTags, useUpdateTag, useDeleteTag } from '@/lib/api';
import { useDialog } from '@/context/DialogContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import ContentCard from '@/components/admin/ui/ContentCard';
import { FaCheck, FaTrash, FaPen, FaHourglassHalf } from 'react-icons/fa6';
import type { TagPublic } from '@/lib/api/types';

const PAGE_SIZE = 50;

export default function AdminTagsPage() {
  const [officialSearch, setOfficialSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [officialPage, setOfficialPage] = useState(0);

  const [editingTags, setEditingTags] = useState<Record<string, TagPublic>>({});

  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const dialog = useDialog();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(officialSearch);
      setOfficialPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [officialSearch]);

  const { data: pendingData, isLoading: pendingLoading } = useAdminTags({ pending: true });
  const { data: officialData, isLoading: officialLoading } = useAdminTags({
    pending: false,
    skip: officialPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: debouncedSearch || undefined,
  });

  const pendingTags = pendingData?.data ?? [];
  const officialTags = officialData?.data ?? [];
  const officialTotal = officialData?.count ?? 0;
  const totalPages = Math.ceil(officialTotal / PAGE_SIZE);

  const handleEditChange = (tagId: string, field: string, value: string) => {
    setEditingTags((prev) => {
      const base =
        prev[tagId] ??
        pendingTags.find((t) => String(t.id) === tagId) ??
        officialTags.find((t) => String(t.id) === tagId);
      if (!base) return prev;
      return { ...prev, [tagId]: { ...base, [field]: value } };
    });
  };

  const handleApproveTag = (tag: TagPublic) => {
    const edited = editingTags[String(tag.id)] ?? tag;

    updateTagMutation.mutate(
      {
        tagId: String(tag.id),
        data: {
          name_de: edited.name_de ?? undefined,
          name_en: edited.name_en ?? undefined,
          name_hu: edited.name_hu ?? undefined,
          is_official: true,
        },
      },
      {
        onSuccess: () => {
          toast.success(t.admin.tags.approve_success);
          setEditingTags((prev) => {
            const next = { ...prev };
            delete next[String(tag.id)];
            return next;
          });
        },
        onError: () => toast.error(t.admin.tags.approve_error),
      }
    );
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!await dialog.confirm('Delete Tag', 'Are you sure you want to delete this tag?')) return;
    deleteTagMutation.mutate(tagId, {
      onSuccess: () => toast.success(t.admin.tags.delete_success),
      onError: () => toast.error(t.admin.tags.delete_error),
    });
  };

  if (pendingLoading || officialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pending Tags */}
      <ContentCard borderColor="#f57c00">
        <div className="flex items-center gap-2 text-[18px] font-bold mb-5 text-[#f57c00] border-b-2 border-[#ffe0b2] pb-[10px]">
          <FaHourglassHalf />
          Pending User Tags (Require Translation)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">Original Input</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">DE (German)</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">EN (English)</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">HU (Hungarian)</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTags.length > 0 ? (
                pendingTags.map((tag) => {
                  const edited = editingTags[String(tag.id)] ?? tag;
                  return (
                    <tr key={tag.id} className="hover:bg-[#fafafa]">
                      <td className="p-3 border-b border-[#eee]">
                        <strong>{tag.name}</strong>
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_de ?? ''}
                          onChange={(e) => handleEditChange(String(tag.id), 'name_de', e.target.value)}
                          placeholder="German..."
                          className="w-full p-[5px] border border-[#ddd] rounded text-[13px]"
                        />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_en ?? ''}
                          onChange={(e) => handleEditChange(String(tag.id), 'name_en', e.target.value)}
                          placeholder="English..."
                          className="w-full p-[5px] border border-[#ddd] rounded text-[13px]"
                        />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_hu ?? ''}
                          onChange={(e) => handleEditChange(String(tag.id), 'name_hu', e.target.value)}
                          placeholder="Hungarian..."
                          className="w-full p-[5px] border border-[#ddd] rounded text-[13px]"
                        />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <button
                          onClick={() => handleApproveTag(tag)}
                          className="py-[5px] px-[10px] text-[11px] rounded border-none font-semibold cursor-pointer transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white mr-2"
                        >
                          <FaCheck /> Add
                        </button>
                        <button
                          onClick={() => handleDeleteTag(String(tag.id))}
                          className="py-[5px] px-[10px] text-[11px] rounded border-none font-semibold cursor-pointer transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#d32f2f] text-white"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#888]">No pending tags</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Global Tags */}
      <ContentCard title={`Global Tag Library (Active) — ${officialTotal} tags`}>
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tags (DE / EN / HU)..."
            value={officialSearch}
            onChange={(e) => setOfficialSearch(e.target.value)}
            className="p-[10px] rounded border border-[#ccc] w-full"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">Tag ID</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">DE</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">EN</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">HU</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">Usage</th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {officialTags.length > 0 ? (
                officialTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-[#fafafa]">
                    <td className="p-3 border-b border-[#eee] text-[#888]">#{tag.id}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_de ?? '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_en ?? '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_hu ?? '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{(tag.usage_count ?? 0).toLocaleString()}</td>
                    <td className="p-3 border-b border-[#eee]">
                      <FaPen className="text-[#666] cursor-pointer hover:text-[#8cb348]" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#888]">
                    {debouncedSearch ? `No tags matching "${debouncedSearch}"` : 'No official tags'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#eee]">
            <span className="text-[13px] text-[#888]">
              Page {officialPage + 1} of {totalPages} ({officialTotal} tags)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOfficialPage((p) => Math.max(0, p - 1))}
                disabled={officialPage === 0}
                className="px-3 py-1 text-[13px] rounded border border-[#ccc] disabled:opacity-40 hover:border-[#8cb348] hover:text-[#8cb348] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setOfficialPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={officialPage >= totalPages - 1}
                className="px-3 py-1 text-[13px] rounded border border-[#ccc] disabled:opacity-40 hover:border-[#8cb348] hover:text-[#8cb348] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ContentCard>
    </>
  );
}
