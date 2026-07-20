"use client";

import { useLanguage } from "@/context/LanguageContext";

interface FeedEmptyStateProps {
  /** Full reset to the overview (clears search, tags, categories). */
  onReset: () => void;
}

/** Shown in place of the feed when an active search/filter yields no results. */
export default function FeedEmptyState({ onReset }: FeedEmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center text-center px-[24px] py-[40px] max-w-[520px] mx-auto">
      <h2 className="text-[28px] leading-[1.15] font-bold text-[var(--color-nav-bg)]">
        {t.feed.empty_state.title}
      </h2>

      <img
        src="/404.png"
        alt="404"
        className="w-[220px] max-w-full h-auto my-[24px]"
      />

      <p className="text-[17px] leading-[1.5] text-[#555]">
        {t.feed.empty_state.subtitle}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-[28px] w-full py-[16px] rounded-[8px] bg-[var(--color-green-offer)] text-white text-[18px] font-medium hover:brightness-110 transition-all"
      >
        {t.feed.empty_state.cta_button}
      </button>
    </div>
  );
}
