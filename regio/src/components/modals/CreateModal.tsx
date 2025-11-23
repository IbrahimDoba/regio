"use client";

import React, { useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { uiTexts } from "@/data/mockData";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [cat, setCat] = useState("green");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const t = uiTexts['GB'];

  if (!isOpen) return null;

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(',', '');
      if (val) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] p-0 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        <div className="p-[15px] border-b border-[#eee] flex justify-between items-center bg-[#f9f9f9]">
          <div className="text-[18px] font-[700] text-[#333]">{t.createTitle}</div>
          <div className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]" onClick={onClose}>&times;</div>
        </div>

        <div className="p-[20px] overflow-y-auto flex-grow">
          
          {/* Category */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">{t.catLabel}</label>
              <FaCircleInfo className="text-[var(--color-turquoise)] cursor-pointer text-[13px]" />
            </div>
            <select 
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)]"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              {Object.entries(t.catOptions).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">{t.titleLabel}</label>
              <FaCircleInfo className="text-[var(--color-turquoise)] cursor-pointer text-[13px]" />
            </div>
            <input 
              type="text" 
              className={cn("w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)]", title.length >= 80 ? "border-[var(--color-red-search)]" : "")}
              placeholder={t.titlePh}
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[11px] color-[#888] mt-[4px]">{title.length}/80</div>
          </div>

          {/* Description */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">{t.descLabel}</label>
              <FaCircleInfo className="text-[var(--color-turquoise)] cursor-pointer text-[13px]" />
            </div>
            <textarea 
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)] h-[80px] resize-none"
              placeholder={t.descPh}
            ></textarea>
          </div>

          {/* Dynamic Fields */}
          {cat === 'green' && (
            <div className="mb-[15px]">
              <div className="flex items-center gap-[6px] mb-[5px]">
                <label className="text-[12px] font-[700] text-[#555]">{t.timeFactor}</label>
              </div>
              <div className="p-[10px_0]">
                 <input type="range" min="0.25" max="3.0" step="0.25" defaultValue="1.0" className="w-full cursor-pointer" />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-[15px]">
             <div className="flex items-center gap-[6px] mb-[5px]">
                <label className="text-[12px] font-[700] text-[#555]">{t.tagsLabel}</label>
                <FaCircleInfo className="text-[var(--color-turquoise)] cursor-pointer text-[13px]" />
             </div>
             <div className="border border-[#ccc] rounded-[4px] bg-[var(--input-bg)] p-[5px] flex flex-wrap gap-[5px]">
                {tags.map((tag, i) => (
                  <div key={i} className="bg-[#e0e0e0] rounded-[12px] p-[2px_10px] text-[12px] flex items-center gap-[5px]">
                    {tag} <span className="cursor-pointer font-bold text-[#666]" onClick={() => removeTag(i)}>&times;</span>
                  </div>
                ))}
                <input 
                  type="text" 
                  className="border-none outline-none bg-transparent text-[14px] flex-grow p-[5px]" 
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
             </div>
          </div>

        </div>

        <div className="p-[15px] border-t border-[#eee] bg-white">
          <div className="flex gap-[10px] mt-[10px]">
            <button className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[#ddd] text-[#333]" onClick={onClose}>{t.cancel}</button>
            <button className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[var(--color-green-offer)] text-white">{t.save}</button>
          </div>
        </div>

      </div>
    </div>
  );
}
