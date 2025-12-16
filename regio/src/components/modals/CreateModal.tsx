"use client";

import React, { useState } from "react";
import { FaCircleInfo, FaSpinner } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingCategory, ListingCreate } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { useCreateListing } from "@/lib/api/hooks/use-listings";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [category, setCategory] = useState<ListingCategory>("OFFER_SERVICE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [priceRegio, setPriceRegio] = useState(10);
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [timeFactor, setTimeFactor] = useState(1.0);

  const createMutation = useCreateListing();

  if (!isOpen) return null;

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(",", "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title || !description) return; // Basic validation

    // Construct payload
    // Note: This is simplified. Different categories might have different attribute needs.
    // For now, we assume simple listing structure.
    const payload: ListingCreate = {
      title,
      description,
      category,
      tags,
      attributes: {
        price: {
          regio: priceRegio,
          time_minutes: timeMinutes,
        },
        time_factor: category === "OFFER_SERVICE" ? timeFactor : undefined,
        location: {
          // Mock location for now, ideally from user or map
          lat: 47.4979,
          lng: 19.0402,
          address: "Budapest",
          region_id: 1,
        },
      },
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        // Reset form?
        setTitle("");
        setDescription("");
        setTags([]);
      },
    });
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] p-0 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="p-[15px] border-b border-[#eee] flex justify-between items-center bg-[#f9f9f9]">
          <div className="text-[18px] font-[700] text-[#333]">
            Create New Listing
          </div>
          <div
            className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]"
            onClick={onClose}
          >
            &times;
          </div>
        </div>

        <div className="p-[20px] overflow-y-auto flex-grow">
          {/* Category */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">
                Category
              </label>
            </div>
            <select
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)]"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
            >
              {Object.keys(CATEGORY_CONFIG).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {CATEGORY_CONFIG[catKey as ListingCategory].label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">
                Title
              </label>
            </div>
            <input
              type="text"
              className={cn(
                "w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)]",
                title.length >= 80 ? "border-[var(--color-red-search)]" : ""
              )}
              placeholder="What are you offering or looking for?"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[11px] color-[#888] mt-[4px]">
              {title.length}/80
            </div>
          </div>

          {/* Description */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">
                Description
              </label>
            </div>
            <textarea
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)] h-[80px] resize-none"
              placeholder="Describe your listing in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          {/* Dynamic Fields */}
          {category === "OFFER_SERVICE" && (
            <div className="mb-[15px]">
              <div className="flex items-center gap-[6px] mb-[5px]">
                <label className="text-[12px] font-[700] text-[#555]">
                  Time Factor
                </label>
              </div>
              <div className="p-[10px_0]">
                <input
                  type="range"
                  min="0.25"
                  max="3.0"
                  step="0.25"
                  value={timeFactor}
                  onChange={(e) => setTimeFactor(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="text-center text-[12px] font-bold text-[#666]">
                  {timeFactor}x
                </div>
              </div>
            </div>
          )}

          {/* Price (Simplified) */}
          <div className="mb-[15px] flex gap-4">
            <div className="flex-1">
              <label className="text-[12px] font-[700] text-[#555] block mb-[5px]">
                Price (Regio)
              </label>
              <input
                type="number"
                value={priceRegio}
                onChange={(e) => setPriceRegio(Number(e.target.value))}
                className="w-full p-[10px] border border-[#ccc] rounded-[4px]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-[700] text-[#555] block mb-[5px]">
                Duration (Min)
              </label>
              <input
                type="number"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                className="w-full p-[10px] border border-[#ccc] rounded-[4px]"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mb-[15px]">
            <div className="flex items-center gap-[6px] mb-[5px]">
              <label className="text-[12px] font-[700] text-[#555]">Tags</label>
            </div>
            <div className="border border-[#ccc] rounded-[4px] bg-[var(--input-bg)] p-[5px] flex flex-wrap gap-[5px]">
              {tags.map((tag, i) => (
                <div
                  key={i}
                  className="bg-[#e0e0e0] rounded-[12px] p-[2px_10px] text-[12px] flex items-center gap-[5px]"
                >
                  {tag}{" "}
                  <span
                    className="cursor-pointer font-bold text-[#666]"
                    onClick={() => removeTag(i)}
                  >
                    &times;
                  </span>
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
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[#ddd] text-[#333]"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[var(--color-green-offer)] text-white flex justify-center items-center gap-2"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <FaSpinner className="animate-spin" />
              )}
              {createMutation.isPending ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
