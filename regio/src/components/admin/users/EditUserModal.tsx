'use client';

import React, { useState, useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';

interface UserAdminView {
  user_code: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  trust_level: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  is_active: boolean;
  verification_status: 'PENDING' | 'VERIFIED';
  balance_time: number;
  balance_regio: string;
  created_at: string;
}

interface EditUserModalProps {
  user: UserAdminView | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userCode: string, updates: any) => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [trustLevel, setTrustLevel] = useState<string>('T1');
  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      setTrustLevel(user.trust_level);
      setVerificationStatus(user.verification_status);
      setIsActive(user.is_active);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    onSave(user.user_code, {
      trust_level: trustLevel,
      verification_status: verificationStatus,
      is_active: isActive,
    });
    onClose();
  };

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.5)] z-[1000] flex justify-center items-center backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-[500px] max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#f9f9f9] border-b border-[#eee] flex justify-between items-center">
          <h2 className="text-[20px] font-[800] text-[#333]">
            Edit User: {user.full_name}
          </h2>
          <FaXmark
            className="text-[24px] cursor-pointer text-[#999] hover:text-[#333]"
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-[30px] overflow-y-auto">
          {/* Trust Level */}
          <div className="mb-4">
            <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
              Trust Level (Manual Override)
            </label>
            <select
              value={trustLevel}
              onChange={(e) => setTrustLevel(e.target.value)}
              className="w-full p-[10px] border border-[#ccc] rounded text-[14px]"
            >
              <option value="T1">T1 Beginner</option>
              <option value="T2">T2 Active</option>
              <option value="T3">T3 Trusted</option>
              <option value="T4">T4 Professional</option>
              <option value="T5">T5 Ambassador</option>
              <option value="T6">T6 Legend</option>
            </select>
          </div>

          {/* Verification Status */}
          <div className="mb-4">
            <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
              Verification Status
            </label>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="w-full p-[10px] border border-[#ccc] rounded text-[14px]"
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          {/* Account Status */}
          <div className="mb-4">
            <label className="block mb-[5px] font-bold text-[13px] text-[#555]">
              Account Status
            </label>
            <select
              value={isActive ? 'active' : 'banned'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className="w-full p-[10px] border border-[#ccc] rounded text-[14px]"
            >
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#eee] text-right bg-white">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#eee] text-[#333] mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
