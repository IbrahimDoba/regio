"use client";

import React from "react";
import { FaScrewdriverWrench, FaMagnifyingGlass, FaBoxOpen, FaMagnifyingGlassPlus, FaHandsHoldingCircle, FaCar, FaCalendarDay } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { CategoryColor } from "@/lib/types";

interface FilterPanelProps {
  isOpen: boolean;
  activeFilters: CategoryColor[];
  toggleFilter: (color: CategoryColor) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const filters: { color: CategoryColor; icon: React.ReactNode }[] = [
  { color: "green", icon: <FaScrewdriverWrench /> },
  { color: "red", icon: <FaMagnifyingGlass /> },
  { color: "blue", icon: <FaBoxOpen /> },
  { color: "orange", icon: <FaMagnifyingGlassPlus /> },
  { color: "purple", icon: <FaHandsHoldingCircle /> },
  { color: "turquoise", icon: <FaCar /> },
  { color: "yellow", icon: <FaCalendarDay /> },
];

export default function FilterPanel({ isOpen, activeFilters, toggleFilter, searchQuery, setSearchQuery }: FilterPanelProps) {
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
          const isActive = activeFilters.includes(f.color);
          return (
            <div 
              key={f.color}
              onClick={() => toggleFilter(f.color)}
              className={cn(
                "w-[40px] h-[40px] rounded-full border-[2px] border-[#eee] flex justify-center items-center text-[16px] cursor-pointer transition-all duration-200",
                isActive ? "border-transparent text-white scale-110" : "bg-white text-[#ccc]"
              )}
              style={{ 
                backgroundColor: isActive ? `var(--color-${f.color === 'yellow' ? 'yellow' : f.color + (f.color === 'green' ? '-offer' : f.color === 'red' ? '-search' : '')})` : undefined,
                // Yellow needs special handling because the var name in CSS is just --color-yellow but others have suffixes in my CSS vars? 
                // Wait, let me check globals.css.
                // --color-green-offer, --color-red-search. Others are just --color-blue, etc.
                // So I need a helper for color mapping.
              }}
            >
              {f.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
}
