"use client";

import React, { useState } from "react";
import { FaUserGear, FaXmark, FaCamera, FaShieldHalved, FaRegCopy, FaFloppyDisk, FaVideo, FaChevronRight, FaBell, FaEnvelope, FaWallet, FaSquarePlus, FaBars } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'trust'>('personal');

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaUserGear className="text-[var(--color-green-offer)]" /> My Profile
          </div>
          <div className="cursor-pointer text-[#888] text-[20px]" onClick={() => window.history.back()}>
            <FaXmark />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="p-[25px_20px] bg-gradient-to-b from-white to-[#f0f7e6] text-center border-b border-[#e0e0e0]">
        <div className="relative w-[100px] h-[100px] mx-auto mb-[15px]">
          <img src="https://i.pravatar.cc/300?img=11" className="w-full h-full rounded-full object-cover border-[3px] border-white shadow-md" />
          <div className="absolute bottom-0 right-0 bg-[var(--color-green-offer)] text-white w-[32px] h-[32px] rounded-full flex justify-center items-center text-[14px] cursor-pointer border-[2px] border-white">
            <FaCamera />
          </div>
        </div>
        
        <div className="text-[22px] font-[800] text-[#222] mb-[5px]">John Myers</div>
        
        <div className="inline-flex items-center gap-[5px] bg-[#e8f5e9] text-[var(--color-green-offer)] p-[4px_10px] rounded-[15px] text-[11px] font-bold mb-[15px]">
          <FaShieldHalved /> Verified Identity
        </div>

        <div className="bg-white border border-dashed border-[#ccc] inline-flex items-center gap-[10px] p-[8px_15px] rounded-[6px] mx-auto">
          <span className="text-[10px] uppercase text-[#888] font-bold tracking-[1px]">User ID:</span>
          <span className="font-mono text-[18px] font-bold text-[#333] tracking-[2px]">C49A1</span>
          <FaRegCopy className="text-[var(--turquoise)] cursor-pointer text-[14px]" onClick={() => alert('ID copied!')} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0] bg-white sticky top-[60px] z-90">
        <div 
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === 'personal' ? 'text-[var(--color-green-offer)] border-[var(--color-green-offer)]' : 'border-transparent hover:bg-[#f9f9f9]'}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal
        </div>
        <div 
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === 'account' ? 'text-[var(--color-green-offer)] border-[var(--color-green-offer)]' : 'border-transparent hover:bg-[#f9f9f9]'}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </div>
        <div 
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === 'trust' ? 'text-[var(--color-green-offer)] border-[var(--color-green-offer)]' : 'border-transparent hover:bg-[#f9f9f9]'}`}
          onClick={() => setActiveTab('trust')}
        >
          Trust & Invites
        </div>
      </div>

      {/* Content */}
      <div className="p-[20px]">
        
        {activeTab === 'personal' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">Base Data (Fixed)</div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">First Name</label>
              <input type="text" className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none" value="John" readOnly />
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">Last Name</label>
              <input type="text" className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none" value="Myers" readOnly />
            </div>

            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[30px] border-b border-[#eee] pb-[5px]">Public Info</div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">Location (City / Zip)</label>
              <input type="text" className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors" defaultValue="New York, 10001" />
              <small className="text-[#888] text-[10px]">Used to calculate distances in the feed.</small>
            </div>
            
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">Language</label>
              <select 
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
              >
                <option value="GB">English (GB)</option>
                <option value="DE">Deutsch</option>
                <option value="HU">Magyar</option>
              </select>
            </div>

            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">About me (Bio)</label>
              <textarea className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors" rows={4} defaultValue="Hi, I'm John! I love fixing things and helping out in the neighborhood."></textarea>
            </div>

            <button className="w-full p-[14px] bg-[var(--color-green-offer)] text-white border-none rounded-[6px] text-[14px] font-bold cursor-pointer mt-[10px] flex justify-center items-center gap-[8px]">
              <FaFloppyDisk /> Save Changes
            </button>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">Login Data</div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">Email Address</label>
              <input type="email" className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors" defaultValue="john@example.com" />
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">Password</label>
              <button className="w-full p-[10px] bg-white border border-[#ccc] rounded-[6px] cursor-pointer text-[14px]">Change Password</button>
            </div>

            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[30px] border-b border-[#eee] pb-[5px]">Notifications</div>
            
            {['Email Digest', 'Instant Push', 'Newsletter'].map((label, i) => (
              <div key={i} className="flex justify-between items-center mb-[15px] py-[10px] border-b border-[#f5f5f5]">
                <div>
                  <span className="text-[14px] font-[600] text-[#333] block">{label}</span>
                  <span className="text-[11px] text-[#888] block mt-[2px]">Description for {label}</span>
                </div>
                <label className="relative inline-block w-[46px] h-[24px]">
                  <input type="checkbox" defaultChecked={i < 2} className="opacity-0 w-0 h-0 peer" />
                  <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[#ccc] transition-[.4s] rounded-[24px] peer-checked:bg-[var(--color-green-offer)] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:transition-[.4s] before:rounded-full peer-checked:before:translate-x-[22px]"></span>
                </label>
              </div>
            ))}

            <button className="w-full p-[14px] bg-[var(--color-green-offer)] text-white border-none rounded-[6px] text-[14px] font-bold cursor-pointer mt-[10px] flex justify-center items-center gap-[8px]">
              <FaFloppyDisk /> Save Settings
            </button>
            
            <div className="mt-[40px] text-center">
              <button className="bg-none border-none text-[#d32f2f] font-bold cursor-pointer" onClick={() => window.location.href = '/auth'}>Log Out</button>
            </div>
          </div>
        )}

        {activeTab === 'trust' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">Verification Status</div>
            <div className="bg-white p-[15px] rounded-[8px] border border-[#eee] mb-[20px] cursor-pointer" onClick={() => window.location.href = '/verification'}>
              <div className="flex gap-[10px] items-center mb-[10px]">
                <FaVideo className="text-[var(--color-green-offer)] text-[20px]" />
                <div>
                  <div className="font-bold">Video Call Verified</div>
                  <div className="text-[12px] text-[#888]">on October 15, 2024 by Moderator Anna</div>
                </div>
              </div>
              <div className="text-[12px] text-[#555] leading-[1.4]">
                Your identity has been confirmed. This gives you full access to trading and inviting friends.
              </div>
            </div>

            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">Invite Friends</div>
            <div className="bg-[#f0f7e6] border border-[#dcedc8] rounded-[8px] p-[15px] flex justify-between items-center cursor-pointer" onClick={() => window.location.href = '/invite'}>
              <div>
                <div className="font-bold text-[var(--color-nav-bg)]">Manage Invites</div>
                <div className="text-[12px] text-[#666]">You have <strong>2 codes</strong> left</div>
              </div>
              <FaChevronRight className="text-[#ccc]" />
            </div>
            <div className="mt-[10px] text-[11px] text-[#888] text-center">
              Inviting active members earns you reputation points.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
