"use client";

import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa6";
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

  // OFFER_SERVICE
  const [timeFactor, setTimeFactor] = useState(1.0);

  // SELL_PRODUCT
  const [productRegio, setProductRegio] = useState("");
  const [productTime, setProductTime] = useState("");

  // OFFER_RENTAL
  const [rentalFeeRegio, setRentalFeeRegio] = useState("");
  const [rentalFeeTime, setRentalFeeTime] = useState("");

  // RIDE_SHARE
  const [rideStart, setRideStart] = useState("");
  const [rideDestination, setRideDestination] = useState("");

  // EVENT_WORKSHOP
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  // SEARCH_SERVICE / SEARCH_PRODUCT (optional budget)
  const [maxBudgetTime, setMaxBudgetTime] = useState("");
  const [maxBudgetRegio, setMaxBudgetRegio] = useState("");

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

  const buildAttributes = (): Record<string, unknown> => {
    switch (category) {
      case "OFFER_SERVICE":
        return { time_factor: timeFactor };
      case "SEARCH_SERVICE":
        return maxBudgetTime ? { max_budget_time: parseInt(maxBudgetTime) } : {};
      case "SELL_PRODUCT":
        return {
          regio_amount: productRegio ? parseInt(productRegio) : undefined,
          time_amount: productTime ? parseInt(productTime) : undefined,
        };
      case "SEARCH_PRODUCT":
        return {
          max_budget_regio: maxBudgetRegio ? parseInt(maxBudgetRegio) : undefined,
          max_budget_time: maxBudgetTime ? parseInt(maxBudgetTime) : undefined,
        };
      case "OFFER_RENTAL":
        return {
          fee_regio: rentalFeeRegio ? parseInt(rentalFeeRegio) : undefined,
          fee_time: rentalFeeTime ? parseInt(rentalFeeTime) : undefined,
        };
      case "RIDE_SHARE":
        return { start: rideStart, destination: rideDestination };
      case "EVENT_WORKSHOP":
        return {
          event_start_date: eventStart,
          event_end_date: eventEnd,
        };
      default:
        return {};
    }
  };

  const isValid = (): boolean => {
    if (!title || title.length < 5) return false;
    if (!description || description.length < 20) return false;
    switch (category) {
      case "SELL_PRODUCT":
        return !!(productRegio || productTime);
      case "OFFER_RENTAL":
        return !!(rentalFeeRegio || rentalFeeTime);
      case "RIDE_SHARE":
        return rideStart.length >= 2 && rideDestination.length >= 2;
      case "EVENT_WORKSHOP":
        return !!(eventStart && eventEnd);
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    const payload: ListingCreate = {
      title,
      description,
      category,
      tags,
      attributes: buildAttributes(),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        setTitle("");
        setDescription("");
        setTags([]);
      },
    });
  };

  const inputClass =
    "w-full p-[10px] border border-[#ccc] rounded-[4px] text-[14px] bg-[var(--input-bg)]";
  const labelClass = "text-[12px] font-[700] text-[#555] block mb-[5px]";
  const fieldClass = "mb-[15px]";

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
          <div className={fieldClass}>
            <label className={labelClass}>Category</label>
            <select
              className={inputClass}
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
          <div className={fieldClass}>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              className={cn(
                inputClass,
                title.length >= 80 ? "border-[var(--color-red-search)]" : ""
              )}
              placeholder="What are you offering or looking for?"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[11px] text-[#888] mt-[4px]">
              {title.length}/100
            </div>
          </div>

          {/* Description */}
          <div className={fieldClass}>
            <label className={labelClass}>Description</label>
            <textarea
              className={cn(inputClass, "h-[80px] resize-none")}
              placeholder="Describe your listing in detail... (min 20 characters)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Category-specific fields ── */}

          {category === "OFFER_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>Time Factor</label>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.25"
                value={timeFactor}
                onChange={(e) => setTimeFactor(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="text-center text-[12px] font-bold text-[#666] mt-1">
                {timeFactor}x
              </div>
            </div>
          )}

          {category === "SEARCH_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>Max Budget (minutes, optional)</label>
              <input
                type="number"
                min="0"
                value={maxBudgetTime}
                onChange={(e) => setMaxBudgetTime(e.target.value)}
                placeholder="e.g. 120"
                className={inputClass}
              />
            </div>
          )}

          {category === "SELL_PRODUCT" && (
            <div className={cn(fieldClass, "flex gap-4")}>
              <div className="flex-1">
                <label className={labelClass}>Price (Regio)</label>
                <input
                  type="number"
                  min="0"
                  value={productRegio}
                  onChange={(e) => setProductRegio(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Price (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={productTime}
                  onChange={(e) => setProductTime(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {category === "SEARCH_PRODUCT" && (
            <div className={cn(fieldClass, "flex gap-4")}>
              <div className="flex-1">
                <label className={labelClass}>Max Budget (Regio, optional)</label>
                <input
                  type="number"
                  min="0"
                  value={maxBudgetRegio}
                  onChange={(e) => setMaxBudgetRegio(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Max Budget (Min, optional)</label>
                <input
                  type="number"
                  min="0"
                  value={maxBudgetTime}
                  onChange={(e) => setMaxBudgetTime(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {category === "OFFER_RENTAL" && (
            <div className={cn(fieldClass, "flex gap-4")}>
              <div className="flex-1">
                <label className={labelClass}>Fee (Regio)</label>
                <input
                  type="number"
                  min="0"
                  value={rentalFeeRegio}
                  onChange={(e) => setRentalFeeRegio(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Fee (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={rentalFeeTime}
                  onChange={(e) => setRentalFeeTime(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {category === "RIDE_SHARE" && (
            <>
              <div className={fieldClass}>
                <label className={labelClass}>Starting Location</label>
                <input
                  type="text"
                  value={rideStart}
                  onChange={(e) => setRideStart(e.target.value)}
                  placeholder="e.g. Munich"
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Destination</label>
                <input
                  type="text"
                  value={rideDestination}
                  onChange={(e) => setRideDestination(e.target.value)}
                  placeholder="e.g. Berlin"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {category === "EVENT_WORKSHOP" && (
            <>
              <div className={fieldClass}>
                <label className={labelClass}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Tags */}
          <div className={fieldClass}>
            <label className={labelClass}>Tags</label>
            <div className="border border-[#ccc] rounded-[4px] bg-[var(--input-bg)] p-[5px] flex flex-wrap gap-[5px]">
              {tags.map((tag, i) => (
                <div
                  key={i}
                  className="bg-[#e0e0e0] rounded-[12px] p-[2px_10px] text-[12px] flex items-center gap-[5px]"
                >
                  {tag}
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
                placeholder="Add tag, press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-[12px] text-red-500 mt-1">
              Failed to create listing. Please check all fields and try again.
            </p>
          )}
        </div>

        <div className="p-[15px] border-t border-[#eee] bg-white">
          <div className="flex gap-[10px]">
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[#ddd] text-[#333]"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[var(--color-green-offer)] text-white flex justify-center items-center gap-2 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !isValid()}
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
