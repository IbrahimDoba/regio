"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ListingCategory } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchTags } from "@/lib/api";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

interface FilterPanelProps {
  isOpen: boolean;
  activeFilters: ListingCategory[];
  toggleFilter: (category: ListingCategory) => void;
  q: string;
  setQ: (q: string) => void;
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  radius: string | undefined;
  setRadius: (radius: string | undefined) => void;
  onSearch: () => void;
}

const categoryFilters = (Object.keys(CATEGORY_CONFIG) as ListingCategory[]).map(
  (cat) => ({ category: cat, ...CATEGORY_CONFIG[cat] })
);

export default function FilterPanel({
  isOpen,
  activeFilters,
  toggleFilter,
  q,
  setQ,
  tags,
  addTag,
  removeTag,
  radius,
  setRadius,
  onSearch,
}: FilterPanelProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(q);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce autocomplete trigger
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: tagSuggestions } = useSearchTags(debouncedInput);
  const suggestions = (tagSuggestions ?? []).filter((s) => !tags.includes(s.name));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setQ(val);
    setShowDropdown(val.length > 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowDropdown(false);
      onSearch();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelectTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      addTag(tagName);
    }
    setInputValue("");
    setQ("");
    setDebouncedInput("");
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border-b border-[#ddd] p-[15px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-top-2 duration-300">
      {/* Unified search input with tag chips */}
      <div ref={containerRef} className="relative mb-[10px]">
        <div className="flex flex-wrap items-center gap-[6px] p-[8px] border border-[#ccc] rounded-[5px] bg-[var(--input-bg)] min-h-[40px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-[4px] px-[8px] py-[2px] bg-[var(--color-green-offer)] text-white text-[13px] rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-80 hover:opacity-100 flex items-center"
              >
                <FaXmark size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-[14px]"
            placeholder={tags.length === 0 ? t.filter_panel.search_placeholder : ""}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length > 1 && setShowDropdown(true)}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-[#ccc] border-t-0 rounded-b-[5px] shadow-md z-20 max-h-[160px] overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="px-[12px] py-[8px] text-[14px] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-[6px]"
                onMouseDown={(e) => { e.preventDefault(); handleSelectTag(s.name); }}
              >
                <span>{s.name}</span>
                {s.is_official && <span className="text-[11px] text-[#999]">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radius + Search button row */}
      <div className="flex gap-[8px] mb-[10px]">
        <select
          className="flex-1 p-[8px] border border-[#ccc] rounded-[5px] bg-[var(--input-bg)] text-[14px]"
          value={radius ?? ""}
          onChange={(e) => setRadius(e.target.value || undefined)}
        >
          <option value="">{t.filter_panel.radius_all}</option>
          <option value="5km">5 km</option>
          <option value="10km">10 km</option>
          <option value="25km">25 km</option>
          <option value="50km">50 km</option>
          <option value="100km">100 km</option>
          <option value="nationwide">{t.filter_panel.radius_nationwide}</option>
        </select>
        <button
          type="button"
          className="flex items-center gap-[6px] px-[14px] py-[8px] bg-[var(--color-green-offer)] text-white rounded-[5px] text-[14px] font-medium hover:brightness-110 transition-all active:scale-95 whitespace-nowrap"
          onClick={onSearch}
        >
          <FaMagnifyingGlass size={13} />
          {t.filter_panel.search_button}
        </button>
      </div>

      {/* Category filters */}
      <div className="flex justify-between flex-wrap gap-[10px]">
        {categoryFilters.map((f) => {
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
