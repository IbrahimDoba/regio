"use client";

import React, { useState } from "react";
import {
  FaLocationDot,
  FaScrewdriverWrench,
  FaMagnifyingGlass,
  FaTags,
  FaMagnifyingGlassDollar,
  FaHandHoldingHand,
  FaCar,
  FaCalendarDays,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingPublic } from "@/lib/api/types";
import { getCategoryDetails } from "@/lib/feed-helpers";
import { formatPriceNode } from "@/lib/feed-helpers-react";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  "fa-screwdriver-wrench": <FaScrewdriverWrench />,
  "fa-magnifying-glass": <FaMagnifyingGlass />,
  "fa-tags": <FaTags />,
  "fa-magnifying-glass-dollar": <FaMagnifyingGlassDollar />,
  "fa-hand-holding-hand": <FaHandHoldingHand />,
  "fa-car": <FaCar />,
  "fa-calendar-days": <FaCalendarDays />,
};

interface FeedCardProps {
  listing: ListingPublic;
  onOpenPreview: (listing: ListingPublic) => void;
  onContact?: (listing: ListingPublic) => void;
}

export default function FeedCard({ listing, onOpenPreview, onContact }: FeedCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const { color, icon, label, colorVar } = getCategoryDetails(listing.category);
  const priceDisplay = formatPriceNode(listing);

  return (
    <div
      className={cn(
        "bg-white mb-[12px] rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-t-[4px] relative transition-all duration-300",
        isOpen ? "open" : ""
      )}
      style={{
        borderTopColor: colorVar,
      }}
    >
      {/* Triangle Indicator */}
      <div
        className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] absolute top-0 right-[22px] z-10"
        style={{
          borderTopColor: colorVar,
        }}
      />

      <div className="p-[15px_12px_10px_12px]">
        {/* Header Grid */}
        <div
          className="grid grid-cols-[50px_1fr] gap-[10px] mb-[5px] cursor-pointer border-b border-[var(--grey-line)] pb-[8px]"
          onClick={() => onOpenPreview(listing)}
        >
          <div className="flex justify-center items-start pt-[2px] text-[42px] leading-none" style={{ color: colorVar }}>
            {CATEGORY_ICON_MAP[icon]}
          </div>
          <div className="flex flex-col justify-between">
            <h3 className="text-[17px] font-[500] leading-[1.3] m-[0_0_8px_0] text-[var(--color-text-main)]">
              {listing.title}
            </h3>
            <div className="flex justify-end items-end gap-[10px]">
              <div className="text-right leading-[1.2] pb-0 flex items-baseline justify-end gap-[5px]">
                <div>
                  <div className="text-[13px] text-black font-[700] whitespace-nowrap">
                    {listing.owner_name}
                  </div>
                  <div className="text-[11px] text-[#777] whitespace-nowrap">
                    {t.feed_card.region_label} {listing.radius_km}{t.feed_card.region_unit}
                  </div>
                </div>
                {listing.owner_avatar ? (
                  <img
                    src={listing.owner_avatar}
                    className="w-[40px] h-[40px] rounded-full object-cover border border-[#ccc] block"
                    alt="User"
                  />
                ) : (
                  <div className="w-[40px] h-[40px] rounded-full bg-[#eee] border border-[#ccc] flex items-center justify-center text-[#999] text-[12px]">
                    {listing.owner_name.substring(0, 2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex justify-between items-center h-[30px] mt-[5px] border-b border-[var(--grey-line)]">
          <div className="flex items-center gap-[15px] h-full">
            <div
              className={cn(
                "w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[11px] border-t-[#d32f2f] cursor-pointer ml-[2px] transition-transform duration-300",
                isOpen ? "rotate-180" : ""
              )}
              onClick={() => setIsOpen(!isOpen)}
            />
            <div className="text-[11px] text-[#444] font-[500] inline-flex items-center gap-[6px] h-full">
              <FaLocationDot className="text-[#555] text-[14px]" /> {t.feed_card.region_label}{" "}
              {listing.radius_km}{t.feed_card.region_unit}
            </div>
          </div>
          <div className="flex gap-[5px] items-center">
            {/* Tool buttons placeholder if needed */}
          </div>
        </div>

        {/* Details (Expandable) */}
        {isOpen && (
          <div className="animate-in fade-in duration-300 block">
            {/* Image thumbnails */}
            {listing.media_urls.length > 0 && (
              <div className="flex gap-[6px] overflow-x-auto pt-[8px] pb-[6px] border-b border-[var(--grey-line)]">
                {listing.media_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-[64px] w-[64px] object-cover rounded-[3px] shrink-0 border border-[#eee]"
                  />
                ))}
              </div>
            )}
            <div className="text-[13px] text-[#444] leading-[1.5em] mb-[10px] pt-[10px] h-[4.5em] overflow-hidden line-clamp-3">
              {listing.description}
            </div>
            <div
              className="text-[11px] underline float-right cursor-pointer ml-[5px] mt-[2px] text-[var(--color-text-main)]"
              onClick={() => onOpenPreview(listing)}
            >
              {t.feed_card.read_more}
            </div>

            <div className="flex justify-between items-center pt-[10px] border-t border-[var(--grey-line)] clear-both">
              <div className="flex items-center gap-[5px] text-[13px] text-[#555] font-[600]">
                {/* Time not in API? Using CreatedAt */}
                {new Date(listing.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-[15px] ml-auto">
                <div className="flex gap-[10px] font-[700] text-[15px] text-right text-[#666]">
                  {priceDisplay}
                </div>
                <button
                  onClick={() => onContact?.(listing)}
                  className={`text-white border-none p-[8px_20px] rounded-[3px] text-[13px] font-[700] cursor-pointer hover:brightness-110 transition-all`}
                  style={{ backgroundColor: colorVar }}
                >
                  {t.feed_card.contact_button}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
