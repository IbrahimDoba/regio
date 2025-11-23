"use client";

import React, { useState } from "react";
import { FaLocationDot, FaEnvelope } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Post } from "@/lib/types";

interface FeedCardProps {
  post: Post;
  onOpenPreview: (post: Post) => void;
}

export default function FeedCard({ post, onOpenPreview }: FeedCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Color mapping for border/text
  const getColorVar = (color: string) => {
    if (color === 'green') return 'var(--color-green-offer)';
    if (color === 'red') return 'var(--color-red-search)';
    if (color === 'yellow') return '#f9a825'; // Special case from CSS
    return `var(--color-${color})`;
  };

  const colorVar = getColorVar(post.color);

  return (
    <div 
      className={cn(
        "bg-white mb-[12px] rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-t-[4px] relative transition-all duration-300",
        isOpen ? "open" : ""
      )}
      style={{ borderTopColor: colorVar }}
    >
      {/* Triangle Indicator */}
      <div 
        className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] absolute top-0 right-[22px] z-10"
        style={{ borderTopColor: colorVar }}
      />

      <div className="p-[15px_12px_10px_12px]">
        {/* Header Grid */}
        <div 
          className="grid grid-cols-[50px_1fr] gap-[10px] mb-[5px] cursor-pointer border-b border-[var(--grey-line)] pb-[8px]"
          onClick={() => onOpenPreview(post)}
        >
          <div className="flex justify-center items-start pt-[2px]">
            <i className={`fa-solid ${post.catIcon} text-[42px] leading-none`} style={{ color: colorVar }}></i>
          </div>
          <div className="flex flex-col justify-between">
            <h3 className="text-[17px] font-[500] leading-[1.3] m-[0_0_8px_0]" style={{ color: colorVar }}>
              {post.content['gb'].title}
            </h3>
            <div className="flex justify-end items-end gap-[10px]">
              <div className="text-right leading-[1.2] pb-0 flex items-baseline justify-end gap-[5px]">
                <div>
                  <div className="text-[13px] text-black font-[700] whitespace-nowrap">{post.user.name}</div>
                  <div className="text-[11px] text-[#777] whitespace-nowrap">{post.user.loc}</div>
                </div>
                <img src={`https://i.pravatar.cc/150?u=${post.user.img}`} className="w-[40px] h-[40px] rounded-full object-cover border border-[#ccc] block" alt="User" />
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
              <FaLocationDot className="text-[#555] text-[14px]" /> Region {post.meta.region}
            </div>
          </div>
          <div className="flex gap-[5px] items-center">
             {/* Tool buttons placeholder if needed */}
          </div>
        </div>

        {/* Details (Expandable) */}
        {isOpen && (
          <div className="animate-in fade-in duration-300 block">
            <div className="text-[13px] text-[#444] leading-[1.5em] mb-[10px] pt-[10px] h-[4.5em] overflow-hidden line-clamp-3">
              {post.content['gb'].desc}
            </div>
            <div 
              className="text-[11px] no-underline float-right cursor-pointer ml-[5px] mt-[2px]"
              style={{ color: 'var(--color-green-offer)' }}
              onClick={() => onOpenPreview(post)}
            >
              Read More &gt;
            </div>
            
            <div className="flex justify-between items-center pt-[10px] border-t border-[var(--grey-line)] clear-both">
              <div className="flex items-center gap-[5px] text-[13px] text-[#555] font-[600]">
                {post.time['gb']}
              </div>
              <div className="flex items-center gap-[15px] ml-auto">
                <div className="flex gap-[10px] font-[700] text-[15px] text-right" style={{ color: ['green', 'blue', 'purple', 'turquoise'].includes(post.color) ? colorVar : '#666' }}>
                  {post.price}
                </div>
                <button 
                  className="text-white border-none p-[8px_20px] rounded-[3px] text-[13px] font-[700] cursor-pointer"
                  style={{ backgroundColor: colorVar }}
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
