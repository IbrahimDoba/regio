"use client";

import React from "react";
import { FaFilter, FaRegCircleUser, FaGlobe } from "react-icons/fa6";
import Image from "next/image";

import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  isFilterOpen: boolean;
  toggleFilter: () => void;
  children?: React.ReactNode; // For the FilterPanel
  count: number;
  total: number;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
}

export default function Header({ isFilterOpen, toggleFilter, children, count, total, showOriginal, onToggleOriginal }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  const langIcons: { [key: string]: string } = { 'EN': '/EN-lang.png', 'HU': '/HU-lang.png', 'DE': '/DE-lang.png' };

  return (
    <header className="bg-[var(--white)] border-b border-[#eee] sticky top-0 z-100">
      <div className="flex justify-between items-center p-[10px_15px]">
        <Image src="/logo-S.png" alt="REGIO" width={100} height={36} priority />
        <div className="flex items-center gap-[10px]">
          <button
            onClick={toggleFilter}
            className={`border py-[6px] px-[15px] rounded-[4px] font-bold flex items-center gap-[5px] text-[14px] cursor-pointer transition-colors ${
              isFilterOpen
                ? "bg-white text-[var(--color-red-search)] border-[var(--color-red-search)]"
                : "bg-[var(--color-red-search)] text-white border-transparent hover:brightness-110"
            }`}
          >
            <FaFilter /> <span>{t.feed.filter_button}</span>
          </button>

          {/* Language Dropdown */}
          <div className="relative">
            <div
              className="rounded-full w-[28px] h-[28px] flex items-center justify-center border border-[#ddd] cursor-pointer select-none overflow-hidden"
              onClick={() => setIsLangOpen(!isLangOpen)}
            >
              <Image src={langIcons[language]} alt={language} width={28} height={28} className="object-cover" />
            </div>
            {isLangOpen && (
              <div className="absolute top-[35px] right-0 bg-white border border-[#ddd] rounded-[4px] shadow-lg z-50 flex flex-col min-w-[50px]">
                {Object.entries(langIcons).map(([lang, icon]) => (
                  <div
                    key={lang}
                    className="p-[5px_10px] cursor-pointer hover:bg-[#f5f5f5] flex justify-center"
                    onClick={() => {
                      setLanguage(lang as "EN" | "DE" | "HU");
                      setIsLangOpen(false);
                    }}
                  >
                    <Image src={icon} alt={lang} width={24} height={24} className="object-cover rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {onToggleOriginal && (
            <button
              onClick={onToggleOriginal}
              title={showOriginal ? "Showing original language" : "Showing translated"}
              className={`flex items-center gap-[4px] text-[12px] font-bold px-[8px] py-[4px] rounded-[4px] border transition-colors ${
                showOriginal
                  ? "bg-[#fff3e0] text-[#e65100] border-[#e65100]"
                  : "bg-white text-[#999] border-[#ddd] hover:border-[#aaa]"
              }`}
            >
              <FaGlobe className="text-[13px]" />
              <span>{showOriginal ? t.feed.original_lang : t.feed.my_lang}</span>
            </button>
          )}

          <div className="text-[28px] text-[#555] cursor-pointer" onClick={() => window.location.href = '/profile'}>
            <FaRegCircleUser />
          </div>
        </div>
      </div>

      {children}

      <div className="text-center pb-[10px] border-t border-[#f9f9f9] pt-[5px]">
        <div className="text-[16px] font-[700] text-[var(--color-text-main)]">
          <span>{t.feed.header.subtitle}</span> [ <span>{count}</span> / <span>{total}</span> ]
        </div>
        <div className="text-[11px] text-[#777] mt-[2px]">
          {t.feed.header.hint}
        </div>
      </div>
    </header>
  );
}
