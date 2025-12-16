"use client";

import React from "react";
import {
  FaScrewdriverWrench,
  FaMagnifyingGlass,
  FaBoxOpen,
  FaMagnifyingGlassPlus,
  FaHandsHoldingCircle,
  FaCar,
  FaCalendarDay,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingCategory } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";

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
// Map icon strings to components if needed, or update CATEGORY_CONFIG to hold components.
// For now, I'll map manually here to keep helper pure data.
const ICON_MAP: Record<string, React.ReactNode> = {
  "fa-screwdriver-wrench": <FaScrewdriverWrench />,
  "fa-magnifying-glass": <FaMagnifyingGlass />,
  "fa-tags": <FaBoxOpen />,
  "fa-magnifying-glass-dollar": <FaMagnifyingGlassPlus />,
  "fa-hand-holding-hand": <FaHandsHoldingCircle />,
  "fa-car": <FaCar />,
  "fa-calendar-days": <FaCalendarDay />,
};

export default function FilterPanel({
  isOpen,
  activeFilters,
  toggleFilter,
  searchQuery,
  setSearchQuery,
}: FilterPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-white border-b border-[#ddd] p-[15px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-top-2 duration-300">
      <input
        type="text"
        className="w-full p-[10px] border border-[#ccc] rounded-[5px] mb-[10px] bg-[var(--input-bg)]"
        placeholder="Search..."
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
                "w-[40px] h-[40px] rounded-full border-[2px] border-[#eee] flex justify-center items-center text-[16px] cursor-pointer transition-all duration-200",
                isActive
                  ? "border-transparent text-white scale-110"
                  : "bg-white text-[#ccc]"
              )}
              style={{
                backgroundColor: isActive ? (f as any).colorVar : undefined,
              }}
              title={f.label}
            >
              {ICON_MAP[f.icon]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
