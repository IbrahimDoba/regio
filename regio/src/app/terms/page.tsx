"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import MobileContainer from "@/components/layout/MobileContainer";
import { FaXmark } from "react-icons/fa6";

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.

Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores.`;

const titles: Record<string, string> = {
  GB: "Terms and Conditions",
  DE: "Nutzungsbedingungen",
  HU: "Felhasználási Feltételek",
};

const flags: Record<string, string> = {
  GB: "🇬🇧 EN",
  HU: "🇭🇺 HU",
  DE: "🇩🇪 DE",
};

export default function TermsPage() {
  const { language, setLanguage } = useLanguage();

  const toggleLang = () => {
    const order: ("GB" | "HU" | "DE")[] = ["GB", "HU", "DE"];
    const idx = order.indexOf(language);
    setLanguage(order[(idx + 1) % order.length]);
  };

  return (
    <MobileContainer className="flex flex-col bg-[#f8f8f8]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#eee] px-[15px] py-[12px] flex items-center justify-between shadow-sm">
        <button
          onClick={() => window.close()}
          className="cursor-pointer flex items-center gap-[8px] text-[#999] font-[700] text-[14px]"
        >
          <FaXmark className="text-[16px]" />
          Close
        </button>
        <div
          className="bg-[#f0f0f0] px-[12px] py-[5px] rounded-[20px] text-[13px] font-[700] cursor-pointer"
          onClick={toggleLang}
        >
          {flags[language]}
        </div>
      </div>

      {/* Content */}
      <div className="p-[25px] flex flex-col gap-[20px] pb-[40px]">
        <h1
          className="text-[24px] font-[800] text-[var(--color-nav-bg)]"
          style={{ fontFamily: "var(--font-roboto-condensed), 'Roboto Condensed', sans-serif" }}
        >
          {titles[language]}
        </h1>

        <p className="text-[11px] text-[#aaa] font-[500]">Last updated: January 2025</p>

        {LOREM.split("\n\n").map((para, i) => (
          <p key={i} className="text-[14px] text-[#444] leading-[1.7]">
            {para}
          </p>
        ))}
      </div>
    </MobileContainer>
  );
}
