"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ListingCategory } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { useLanguage } from "@/context/LanguageContext";

interface FilterPanelProps {
  isOpen: boolean;
  activeFilters: ListingCategory[];
  toggleFilter: (category: ListingCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Generate filters from config to ensure consistency
const filters = (Object.keys(CATEGORY_CONFIG) as ListingCategory[]).map(
  (cat) => ({
    category: cat,
    ...CATEGORY_CONFIG[cat],
  })
);

export default function FilterPanel({
  isOpen,
  activeFilters,
  toggleFilter,
  searchQuery,
  setSearchQuery,
}: FilterPanelProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="bg-white border-b border-[#ddd] p-[15px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-top-2 duration-300">
      <input
        type="text"
        className="w-full p-[10px] border border-[#ccc] rounded-[5px] mb-[10px] bg-[var(--input-bg)]"
        placeholder={t.filter_panel.search_placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="flex justify-between flex-wrap gap-[10px]">
        {filters.map((f) => {
          const isActive = activeFilters.includes(f.category);
          return (
            <div
              key={f.category}
              onClick={() => toggleFilter(f.category)}
              className={cn(
                "w-[44px] h-[44px] rounded-full border-[2px] border-[#eee] flex justify-center items-center cursor-pointer transition-all duration-200",
                isActive ? "border-transparent scale-110" : "bg-white"
              )}
              style={{
                backgroundColor: isActive ? CATEGORY_CONFIG[f.category].colorVar : undefined,
              }}
              title={t.category_labels[f.category]}
            >
              <img
                src={f.icon}
                alt={f.label}
                className="w-[26px] h-[26px] object-contain"
                style={{ filter: isActive ? "brightness(0) invert(1)" : "none" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
