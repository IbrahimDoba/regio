'use client';

import React, { useState } from 'react';
import ContentCard from '@/components/admin/ui/ContentCard';
import { FaPaperPlane } from 'react-icons/fa6';

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      alert('Please fill in both title and message body');
      return;
    }

    // TODO: Implement broadcast API call when backend endpoint is ready
    alert(`Broadcast sent to ${targetAudience}!\n\nTitle: ${title}\nBody: ${body}`);

    // Reset form
    setTitle('');
    setBody('');
    setTargetAudience('ALL');
  };

  return (
    <div className="max-w-[700px]">
      <ContentCard title="Send Message to All Users">
        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            Message Title
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
            Message Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message to all users..."
            className="w-full p-[10px] border border-[#ccc] rounded resize-none"
            rows={8}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
            Target Audience
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full p-[10px] border border-[#ccc] rounded"
          >
            <option value="ALL">All Users</option>
            <option value="VERIFIED">Only Verified</option>
            <option value="PENDING">Only Pending</option>
            <option value="T1_T2">Trust T1-T2 (Beginners)</option>
            <option value="T5_T6">Trust T5-T6 (Leaders)</option>
          </select>
        </div>

        <button
          onClick={handleSendBroadcast}
          className="w-full py-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center justify-center gap-[5px] bg-[#8cb348] text-white"
        >
          <FaPaperPlane />
          Send Broadcast
        </button>

        {/* Info Box */}
        <div className="mt-5 p-4 bg-[#f0f7ff] border border-[#bbdefb] rounded">
          <p className="text-[12px] text-[#555]">
            <strong>Note:</strong> Broadcast messages will be sent as system notifications to all
            users matching the selected criteria. Use this feature responsibly.
          </p>
        </div>
      </ContentCard>
    </div>
  );
}
