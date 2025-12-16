"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const pageHeadlines = {
  GB: {
    "/admin/users": "User Management",
    "/admin/tags": "Tag Management",
    "/admin/disputes": "Disputes",
    "/admin/broadcast": "Broadcasts",
  },
  DE: {
    "/admin/users": "Benutzerverwaltung",
    "/admin/tags": "Tag-Verwaltung",
    "/admin/disputes": "Konflikte",
    "/admin/broadcast": "Rundruf",
  },
  HU: {
    "/admin/users": "Felhasználó Kezelés",
    "/admin/tags": "Címke Kezelés",
    "/admin/disputes": "Viták",
    "/admin/broadcast": "Körlevél",
  },
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  const flags: { [key: string]: string } = {
    GB: "🇬🇧 EN",
    HU: "🇭🇺 HU",
    DE: "🇩🇪 DE",
  };

  const langOrder: ("GB" | "HU" | "DE")[] = ["GB", "HU", "DE"];

  const toggleLang = () => {
    const idx = langOrder.indexOf(language);
    setLanguage(langOrder[(idx + 1) % langOrder.length]);
  };

  const headline =
    pageHeadlines[language][pathname as keyof typeof pageHeadlines.GB] ||
    "Admin Dashboard";

  return (
    <div className="flex justify-between items-center px-[30px] pt-[30px] pb-[20px]">
      <h1 className="text-[28px] font-[800] text-[#333]">{headline}</h1>

      <div
        className="bg-white py-2 px-4 rounded-[20px] cursor-pointer font-bold text-[13px] shadow-[0_2px_5px_rgba(0,0,0,0.05)] border border-[#eee] flex items-center gap-[5px]"
        onClick={toggleLang}
      >
        {flags[language]}
      </div>
    </div>
  );
}
