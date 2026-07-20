"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ListingCategory, TagAutocomplete } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchTags } from "@/lib/api";
import { setStoredHomebaseZip } from "@/lib/api/hooks/use-listings";
import { FaXmark, FaLocationDot, FaGear, FaMagnifyingGlass } from "react-icons/fa6";

interface FilterPanelProps {
  isOpen: boolean;
  activeFilters: ListingCategory[];
  toggleFilter: (category: ListingCategory) => void;
  q: string;
  setQ: (q: string) => void;
  tags: TagAutocomplete[];
  addTag: (tag: TagAutocomplete) => void;
  removeTag: (tagName: string) => void;
  viewerZip: string;
  setViewerZip: (zip: string) => void;
  maxDistanceKm: number | undefined;
  setMaxDistanceKm: (km: number | undefined) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

const categoryFilters = (Object.keys(CATEGORY_CONFIG) as ListingCategory[]).map(
  (cat) => ({ category: cat, ...CATEGORY_CONFIG[cat] })
);

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function FilterPanel({
  isOpen,
  activeFilters,
  toggleFilter,
  q,
  setQ,
  tags,
  addTag,
  removeTag,
  viewerZip,
  setViewerZip,
  maxDistanceKm,
  setMaxDistanceKm,
  onSearch,
  onClearSearch,
}: FilterPanelProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(q);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: tagSuggestions } = useSearchTags(debouncedInput);
  const suggestions = (tagSuggestions ?? []).filter((s) => !tags.some((t) => t.name === s.name));

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

  const handleSelectTag = (tag: TagAutocomplete) => {
    if (!tags.some((t) => t.name === tag.name)) addTag(tag);
    setInputValue("");
    setQ("");
    setDebouncedInput("");
    setShowDropdown(false);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setViewerZip(val);
    if (!val) setMaxDistanceKm(undefined);
    if (val.length >= 4) setStoredHomebaseZip(val);
  };

  const handleToggleSettings = () => {
    if (showSettings) {
      setMaxDistanceKm(undefined);
    }
    setShowSettings(!showSettings);
  };

  const handleClear = () => {
    setInputValue("");
    setQ("");
    setDebouncedInput("");
    setShowDropdown(false);
    onClearSearch();
  };

  return (
    <div className="bg-white border-b border-[#ddd] p-[15px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-top-2 duration-300">

      {/* Search row: input + settings toggle */}
      <div className="flex gap-[8px] items-start mb-[6px]">
        <div ref={containerRef} className="relative flex-1">
          <div className="flex flex-wrap items-center gap-[6px] p-[8px] border border-[#ccc] rounded-[5px] bg-[var(--input-bg)] min-h-[40px]">
            {tags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-[4px] px-[8px] py-[2px] bg-[var(--color-green-offer)] text-white text-[13px] rounded-full"
              >
                {tag.label}
                <button
                  type="button"
                  onClick={() => removeTag(tag.name)}
                  className="opacity-80 hover:opacity-100 flex items-center"
                >
                  <FaXmark size={10} />
                </button>
              </span>
            ))}
            <div className="relative flex-1 min-w-[120px]">
              <input
                type="text"
                className="w-full border-none outline-none bg-transparent text-[14px] pr-[20px]"
                placeholder={tags.length === 0 ? t.filter_panel.search_placeholder : ""}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => inputValue.length > 1 && setShowDropdown(true)}
              />
              {inputValue && (
                <button
                  onClick={handleClear}
                  type="button"
                  className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] flex items-center focus:outline-none"
                  aria-label="Clear input"
                >
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-[#ccc] border-t-0 rounded-b-[5px] shadow-md z-20 max-h-[160px] overflow-y-auto">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="px-[12px] py-[8px] text-[14px] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-[6px]"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectTag(s); }}
                >
                  <span>{s.label}</span>
                  {s.is_official && <span className="text-[11px] text-[#999]">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={() => { setShowDropdown(false); onSearch(); }}
          className="h-[40px] px-[14px] flex items-center gap-[6px] rounded-[5px] bg-[var(--color-green-offer)] text-white text-[14px] font-bold shrink-0 hover:brightness-110 transition-all whitespace-nowrap"
        >
          <FaMagnifyingGlass size={14} />
          {t.filter_panel.search_button}
        </button>

        {/* Settings toggle button */}
        <button
          type="button"
          onClick={handleToggleSettings}
          className={cn(
            "h-[40px] w-[40px] flex items-center justify-center rounded-[5px] border-[2px] transition-all shrink-0",
            showSettings
              ? "border-[var(--color-nav-bg)] text-[var(--color-nav-bg)] bg-white"
              : "border-[#ccc] text-[#888] bg-[var(--input-bg)]"
          )}
        >
          <FaGear size={16} />
        </button>
      </div>

      {/* Settings panel: ZIP + Distance */}
      {showSettings && (
        <div className="flex gap-[8px] mb-[6px]">
          <div className="relative w-[180px] shrink-0">
            <FaLocationDot className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[#888] text-[13px] pointer-events-none" />
            <input
              type="text"
              className="w-full pl-[26px] pr-[8px] py-[8px] border border-[#ccc] rounded-[5px] bg-[var(--input-bg)] text-[14px]"
              placeholder={t.filter_panel.homebase_placeholder}
              value={viewerZip}
              onChange={handleZipChange}
              maxLength={4}
            />
          </div>
          <select
            className="flex-1 p-[8px] border border-[#ccc] rounded-[5px] bg-[var(--input-bg)] text-[14px]"
            value={maxDistanceKm ?? ""}
            onChange={(e) => setMaxDistanceKm(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">{t.filter_panel.max_distance_all}</option>
            {DISTANCE_OPTIONS.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </div>
      )}

      {/* Category filter buttons */}
      <div className="flex justify-between gap-[4px] sm:gap-[10px] mt-[16px]">
        {categoryFilters.map((f) => {
          const isActive = activeFilters.includes(f.category);
          return (
            <div
              key={f.category}
              onClick={() => toggleFilter(f.category)}
              className={cn(
                "w-[36px] h-[36px] sm:w-[44px] sm:h-[44px] rounded-full border-[2px] border-[#eee] flex justify-center items-center cursor-pointer transition-all duration-200 shrink-0",
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
                className="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px] object-contain"
                style={{ filter: isActive ? "brightness(0) invert(1)" : "none" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
