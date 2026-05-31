"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminHeader() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const langIcons: { [key: string]: string } = {
    EN: "/EN-lang.png",
    HU: "/HU-lang.png",
    DE: "/DE-lang.png",
  };

  const langOrder: ("EN" | "HU" | "DE")[] = ["EN", "HU", "DE"];

  const toggleLang = () => {
    const idx = langOrder.indexOf(language);
    setLanguage(langOrder[(idx + 1) % langOrder.length]);
  };

  const pageMap: Record<string, keyof typeof t.admin.header> = {
    "/admin/users": "user_management",
    "/admin/tags": "tag_management",
    "/admin/disputes": "disputes",
    "/admin/broadcast": "broadcasts",
  };
  const headlineKey = pageMap[pathname];
  const headline = headlineKey ? t.admin.header[headlineKey] : t.admin.header.default;

  return (
    <div className="flex justify-between items-center px-[30px] pt-[30px] pb-[20px]">
      <h1 className="text-[28px] font-[800] text-[#333]">{headline}</h1>

      <div
        className="bg-white py-2 px-4 rounded-[20px] cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.05)] border border-[#eee] flex items-center gap-[5px]"
        onClick={toggleLang}
      >
        <Image src={langIcons[language]} alt={language} width={24} height={24} className="object-cover rounded-full" />
      </div>
    </div>
  );
}
