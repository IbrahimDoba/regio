"use client";

import React from "react";
import { FaEnvelope } from "react-icons/fa6";
import { ListingPublic } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getCategoryDetails, formatPrice } from "@/lib/feed-helpers";

interface PreviewModalProps {
  listing: ListingPublic | null;
  onClose: () => void;
}

export default function PreviewModal({ listing, onClose }: PreviewModalProps) {
  if (!listing) return null;

  const { color, icon, label, colorVar } = getCategoryDetails(listing.category);
  const priceDisplay = formatPrice(listing);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] p-0 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-[15px] border-b border-[#eee] flex justify-between items-start bg-[#f9f9f9]">
          <div className="flex gap-[15px] w-[85%]">
            <i
              className={`fa-solid ${icon} text-[32px] mt-[2px]`}
              style={{ color: colorVar }}
            ></i>
            <div className="text-[18px] font-[700] leading-[1.3] text-[#333]">
              {listing.title}
            </div>
          </div>
          <div
            className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]"
            onClick={onClose}
          >
            &times;
          </div>
        </div>

        {/* Body */}
        <div className="p-[20px] overflow-y-auto flex-grow">
          <div className="flex justify-between mb-[20px] text-[12px] text-[#666] border-b border-[#eee] pb-[10px]">
            <div className="flex items-center gap-[10px]">
              {listing.owner_avatar ? (
                <img
                  src={listing.owner_avatar}
                  className="w-[40px] h-[40px] rounded-full"
                  alt="User"
                />
              ) : (
                <div className="w-[40px] h-[40px] rounded-full bg-[#eee] flex items-center justify-center text-[#999]">
                  {listing.owner_name.substring(0, 2)}
                </div>
              )}
              <div>
                <div className="font-bold text-[#333]">
                  {listing.owner_name}
                </div>
                <div>Region {listing.radius_km}km</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {new Date(listing.created_at).toLocaleDateString()}
              </div>
              {/* Short ID */}
              <div className="mt-[2px] text-[10px] text-[#999]">
                ID: #{listing.id.substring(0, 8)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-[5px] mb-[15px]">
            {listing.tags.map((tag, i) => (
              <div
                key={i}
                className="bg-[#eee] p-[4px_10px] rounded-[12px] text-[11px] text-[#555] font-[600]"
              >
                {tag}
              </div>
            ))}
          </div>

          <div className="text-[15px] leading-[1.6] text-[#333] mb-[20px] whitespace-pre-wrap">
            {listing.description}
          </div>
        </div>

        {/* Footer */}
        <div className="p-[15px] border-t border-[#eee] bg-white">
          {priceDisplay && (
            <div className="bg-[#f0f7e6] p-[15px] rounded-[6px] flex justify-between items-center mb-[10px] border border-[#dcebc0]">
              <span className="text-[12px] text-[#666] font-[600]">
                Value / Price:
              </span>
              <span className="text-[18px] font-[800] text-[var(--color-green-offer)]">
                {priceDisplay}
              </span>
            </div>
          )}
          <button
            className={`w-full p-[12px] text-[16px] rounded-[5px] border-none text-white font-bold cursor-pointer flex justify-center items-center gap-[10px] hover:brightness-110`}
            style={{ backgroundColor: colorVar }}
          >
            <FaEnvelope /> Contact
          </button>
        </div>
      </div>
    </div>
  );
}
