'use client';

import React, { useState } from 'react';
import { useAdminTags, useUpdateTag, useDeleteTag } from '@/lib/api';
import ContentCard from '@/components/admin/ui/ContentCard';
import { FaCheck, FaTrash, FaPen, FaHourglassHalf } from 'react-icons/fa6';

interface TagAdminView {
  id: number;
  name: string;
  name_de: string | null;
  name_en: string | null;
  name_hu: string | null;
  is_official: boolean;
  usage_count: number;
}

export default function AdminTagsPage() {
  const { data: pendingTags, isLoading: pendingLoading } = useAdminTags(true);
  const { data: officialTags, isLoading: officialLoading } = useAdminTags(false);
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const [editingTags, setEditingTags] = useState<{ [key: number]: TagAdminView }>({});

  const handleEditChange = (tagId: number, field: string, value: string) => {
    setEditingTags((prev) => ({
      ...prev,
      [tagId]: {
        ...(prev[tagId] || (pendingTags?.find((t) => t.id === tagId) || officialTags?.find((t) => t.id === tagId))!),
        [field]: value,
      },
    }));
  };

  const handleApproveTag = (tag: TagAdminView) => {
    const editedTag = editingTags[tag.id] || tag;

    updateTagMutation.mutate(
      {
        tagId: tag.id,
        updates: {
          name_de: editedTag.name_de || undefined,
          name_en: editedTag.name_en || undefined,
          name_hu: editedTag.name_hu || undefined,
          is_official: true,
        },
      },
      {
        onSuccess: () => {
          alert('Tag approved successfully!');
          setEditingTags((prev) => {
            const newState = { ...prev };
            delete newState[tag.id];
            return newState;
          });
        },
        onError: (error) => {
          console.error('Tag approval error:', error);
          alert('Failed to approve tag');
        },
      }
    );
  };

  const handleDeleteTag = (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    deleteTagMutation.mutate(tagId, {
      onSuccess: () => {
        alert('Tag deleted successfully!');
      },
      onError: (error) => {
        console.error('Tag deletion error:', error);
        alert('Failed to delete tag');
      },
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
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Original Input
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  DE (German)
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  EN (English)
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  HU (Hungarian)
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingTags && pendingTags.length > 0 ? (
                pendingTags.map((tag) => {
                  const edited = editingTags[tag.id] || tag;
                  return (
                    <tr key={tag.id} className="hover:bg-[#fafafa]">
                      <td className="p-3 border-b border-[#eee]">
                        <strong>{tag.name}</strong>
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_de || ''}
                          onChange={(e) => handleEditChange(tag.id, 'name_de', e.target.value)}
                          placeholder="German..."
                          className="w-full p-[5px] border border-[#ddd] rounded text-[13px]"
                        />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_en || ''}
                          onChange={(e) => handleEditChange(tag.id, 'name_en', e.target.value)}
                          placeholder="English..."
                          className="w-full p-[5px] border border-[#ddd] rounded text-[13px]"
                        />
                      </td>
                      <td className="p-3 border-b border-[#eee]">
                        <input
                          type="text"
                          value={edited.name_hu || ''}
                          onChange={(e) => handleEditChange(tag.id, 'name_hu', e.target.value)}
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
                          onClick={() => handleDeleteTag(tag.id)}
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
                  <td colSpan={5} className="p-8 text-center text-[#888]">
                    No pending tags
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Global Tags */}
      <ContentCard title="Global Tag Library (Active)">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Tag ID
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  DE
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  EN
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  HU
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Usage
                </th>
                <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {officialTags && officialTags.length > 0 ? (
                officialTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-[#fafafa]">
                    <td className="p-3 border-b border-[#eee]">#{tag.id}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_de || '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_en || '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.name_hu || '-'}</td>
                    <td className="p-3 border-b border-[#eee]">{tag.usage_count.toLocaleString()}</td>
                    <td className="p-3 border-b border-[#eee]">
                      <FaPen className="text-[#666] cursor-pointer hover:text-[#8cb348]" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#888]">
                    No official tags
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </>
  );
}
