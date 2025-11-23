"use client";

import React from "react";
import { FaArrowRightArrowLeft, FaFilter, FaRegCircleUser } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  isFilterOpen: boolean;
  toggleFilter: () => void;
  children?: React.ReactNode; // For the FilterPanel
  count: number;
  total: number;
}

export default function Header({ isFilterOpen, toggleFilter, children, count, total }: HeaderProps) {
  const { language, setLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  const flags: { [key: string]: string } = { 'GB': '🇬🇧', 'HU': '🇭🇺', 'DE': '🇩🇪' };

  return (
    <header className="bg-[var(--white)] border-b border-[#eee] sticky top-0 z-100">
      <div className="flex justify-between items-center p-[10px_15px]">
        <div className="flex items-center gap-[5px] text-[24px] font-[900] color-[#1a3b15] tracking-[-1px] text-[#1a3b15]">
          <FaArrowRightArrowLeft className="text-[18px]" /> REGIO
        </div>
        <div className="flex items-center gap-[10px]">
          <button 
            onClick={toggleFilter}
            className="bg-[var(--color-red-search)] text-white border-none py-[6px] px-[15px] rounded-[4px] font-bold flex items-center gap-[5px] text-[14px] cursor-pointer transition-colors hover:brightness-110"
          >
            <FaFilter /> <span>Filter</span>
          </button>
          
          {/* Language Dropdown */}
          <div className="relative">
            <div 
              className="text-[24px] rounded-full w-[28px] h-[28px] flex items-center justify-center border border-[#ddd] cursor-pointer select-none"
              onClick={() => setIsLangOpen(!isLangOpen)}
            >
              {flags[language]}
            </div>
            {isLangOpen && (
              <div className="absolute top-[35px] right-0 bg-white border border-[#ddd] rounded-[4px] shadow-lg z-50 flex flex-col min-w-[50px]">
                {Object.entries(flags).map(([lang, flag]) => (
                  <div 
                    key={lang}
                    className="p-[5px_10px] text-[20px] cursor-pointer hover:bg-[#f5f5f5] flex justify-center"
                    onClick={() => {
                      setLanguage(lang as any);
                      setIsLangOpen(false);
                    }}
                  >
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[28px] text-[#555] cursor-pointer" onClick={() => window.location.href = '/profile'}>
            <FaRegCircleUser />
          </div>
        </div>
      </div>

      {children}

      <div className="text-center pb-[10px] border-t border-[#f9f9f9] pt-[5px]">
        <div className="text-[16px] font-[700] text-[var(--color-text-main)]">
          <span>All current offers and searches</span> [ <span>{count}</span> / <span>{total}</span> ]
        </div>
        <div className="text-[11px] text-[#777] mt-[2px]">
          Scroll through or use search or filter with the red button
        </div>
      </div>
    </header>
  );
}
