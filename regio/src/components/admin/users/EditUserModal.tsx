'use client';

import React, { useState, useEffect } from 'react';
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { FaXmark } from 'react-icons/fa6';
import type { AdminUserUpdate, Language, TrustLevel, VerificationStatus } from '@/lib/api/types';

interface UserAdminView {
  user_code: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  trust_level: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  is_active: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTION_REQUIRED';
  balance_time: number;
  balance_regio: string;
  created_at: string;
}

interface EditUserModalProps {
  user: UserAdminView | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userCode: string, updates: AdminUserUpdate) => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  // Pre-populated from list response
  const [email, setEmail] = useState('');
  const [trustLevel, setTrustLevel] = useState<TrustLevel>('T1');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('PENDING');
  const [isActive, setIsActive] = useState(true);

  // Not in list response — starts at sentinel "no change" or blank
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [language, setLanguage] = useState<Language | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean | null>(null);
  const [totalTimeEarned, setTotalTimeEarned] = useState('');

  useEffect(() => {
    if (user) {
      requestAnimationFrame(() => {
        setEmail(user.email);
        setTrustLevel(user.trust_level);
        setVerificationStatus(user.verification_status);
        setIsActive(user.is_active);
        setFirstName('');
        setLastName('');
        setLanguage(null);
        setIsSystemAdmin(null);
        setTotalTimeEarned('');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_code]);

  useModalKeyboard(onClose, undefined, isOpen && !!user);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    const updates: AdminUserUpdate = {};

    if (email !== user.email) updates.email = email;
    if (trustLevel !== user.trust_level) updates.trust_level = trustLevel;
    if (verificationStatus !== user.verification_status) updates.verification_status = verificationStatus;
    if (isActive !== user.is_active) updates.is_active = isActive;

    if (firstName.trim()) updates.first_name = firstName.trim();
    if (lastName.trim()) updates.last_name = lastName.trim();
    if (language !== null) updates.language = language;
    if (isSystemAdmin !== null) updates.is_system_admin = isSystemAdmin;
    if (totalTimeEarned !== '') {
      const parsed = parseInt(totalTimeEarned, 10);
      if (!isNaN(parsed)) updates.total_time_earned = parsed;
    }

    if (Object.keys(updates).length > 0) {
      onSave(user.user_code, updates);
    }
    onClose();
  };

  const labelClass = 'block mb-[5px] font-bold text-[13px] text-[#555]';
  const inputClass = 'w-full p-[10px] border border-[#ccc] rounded text-[14px]';
  const sectionClass = 'mb-6';
  const sectionTitleClass = 'text-[11px] font-[800] uppercase tracking-widest text-[#aaa] mb-3';

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-center">
      <div
        className="w-full bg-[rgba(160,160,160,0.38)] py-[28px] flex justify-center px-4"
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

          {/* Identity Corrections */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>Identity Corrections</p>
            <p className="text-[12px] text-[#999] mb-3">Leave blank to keep unchanged.</p>
            <div className="mb-4">
              <label className={labelClass}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={user.full_name.split(' ')[0]}
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={user.full_name.split(' ').slice(1).join(' ') || '—'}
                className={inputClass}
              />
            </div>
          </div>

          {/* Account Info */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>Account Info</p>
            <div className="mb-4">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Language</label>
              <select
                value={language ?? ''}
                onChange={(e) => setLanguage((e.target.value as Language) || null)}
                className={inputClass}
              >
                <option value="">No change</option>
                <option value="EN">English (EN)</option>
                <option value="DE">German (DE)</option>
                <option value="HU">Hungarian (HU)</option>
              </select>
            </div>
          </div>

          {/* Status & Privileges */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>Status &amp; Privileges</p>
            <div className="mb-4">
              <label className={labelClass}>Account Status</label>
              <select
                value={isActive ? 'active' : 'banned'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>System Admin</label>
              <select
                value={isSystemAdmin === null ? '' : isSystemAdmin ? 'yes' : 'no'}
                onChange={(e) => {
                  const v = e.target.value;
                  setIsSystemAdmin(v === '' ? null : v === 'yes');
                }}
                className={inputClass}
              >
                <option value="">No change</option>
                <option value="yes">Yes — Grant admin</option>
                <option value="no">No — Revoke admin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className={inputClass}
              >
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="ACTION_REQUIRED">Action Required</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Trust Level (Manual Override)</label>
              <select
                value={trustLevel}
                onChange={(e) => setTrustLevel(e.target.value as TrustLevel)}
                className={inputClass}
              >
                <option value="T1">T1 Beginner</option>
                <option value="T2">T2 Active</option>
                <option value="T3">T3 Trusted</option>
                <option value="T4">T4 Professional</option>
                <option value="T5">T5 Ambassador</option>
                <option value="T6">T6 Legend</option>
              </select>
            </div>
          </div>

          {/* Financials */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>Financials</p>
            <div className="mb-4">
              <label className={labelClass}>Total Time Earned (minutes)</label>
              <input
                type="number"
                min="0"
                value={totalTimeEarned}
                onChange={(e) => setTotalTimeEarned(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className={inputClass}
              />
            </div>
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
    </div>
  );
}
