'use client';

import React, { useState, useEffect } from 'react';
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { FaXmark } from 'react-icons/fa6';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
  const em = t.admin.users.edit_modal;
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
            {em.title.replace('{name}', user.full_name)}
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
            <p className={sectionTitleClass}>{em.identity_section}</p>
            <p className="text-[12px] text-[#999] mb-3">{em.identity_hint}</p>
            <div className="mb-4">
              <label className={labelClass}>{em.first_name_label}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={user.full_name.split(' ')[0]}
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>{em.last_name_label}</label>
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
            <p className={sectionTitleClass}>{em.account_info_section}</p>
            <div className="mb-4">
              <label className={labelClass}>{em.email_label}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>{em.language_label}</label>
              <select
                value={language ?? ''}
                onChange={(e) => setLanguage((e.target.value as Language) || null)}
                className={inputClass}
              >
                <option value="">{em.language_no_change}</option>
                <option value="EN">{em.language_en}</option>
                <option value="DE">{em.language_de}</option>
                <option value="HU">{em.language_hu}</option>
              </select>
            </div>
          </div>

          {/* Status & Privileges */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>{em.status_section}</p>
            <div className="mb-4">
              <label className={labelClass}>{em.account_label}</label>
              <select
                value={isActive ? 'active' : 'banned'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className={inputClass}
              >
                <option value="active">{em.account_active}</option>
                <option value="banned">{em.account_banned}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>{em.system_admin_label}</label>
              <select
                value={isSystemAdmin === null ? '' : isSystemAdmin ? 'yes' : 'no'}
                onChange={(e) => {
                  const v = e.target.value;
                  setIsSystemAdmin(v === '' ? null : v === 'yes');
                }}
                className={inputClass}
              >
                <option value="">{em.admin_no_change}</option>
                <option value="yes">{em.admin_grant}</option>
                <option value="no">{em.admin_revoke}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>{em.verification_label}</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className={inputClass}
              >
                <option value="PENDING">{em.verification_pending}</option>
                <option value="VERIFIED">{em.verification_verified}</option>
                <option value="REJECTED">{em.verification_rejected}</option>
                <option value="ACTION_REQUIRED">{em.verification_action_required}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={labelClass}>{em.trust_override_label}</label>
              <select
                value={trustLevel}
                onChange={(e) => setTrustLevel(e.target.value as TrustLevel)}
                className={inputClass}
              >
                <option value="T1">{em.trust_t1}</option>
                <option value="T2">{em.trust_t2}</option>
                <option value="T3">{em.trust_t3}</option>
                <option value="T4">{em.trust_t4}</option>
                <option value="T5">{em.trust_t5}</option>
                <option value="T6">{em.trust_t6}</option>
              </select>
            </div>
          </div>

          {/* Financials */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>{em.financials_section}</p>
            <div className="mb-4">
              <label className={labelClass}>{em.time_earned_label}</label>
              <input
                type="number"
                min="0"
                value={totalTimeEarned}
                onChange={(e) => setTotalTimeEarned(e.target.value)}
                placeholder={em.time_earned_placeholder}
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
            {em.cancel_button}
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white"
          >
            {em.save_button}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
