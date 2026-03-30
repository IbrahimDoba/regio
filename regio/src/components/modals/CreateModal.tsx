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

  // Global — all categories
  const [priceNotes, setPriceNotes] = useState("");

  // OFFER_SERVICE
  const [timeFactor, setTimeFactor] = useState(1.0);

  // SELL_PRODUCT
  const [productTime, setProductTime] = useState("");
  const [productGaras, setProductGaras] = useState("");
  const [productCondition, setProductCondition] = useState<"NEW" | "USED">("NEW");
  const [productStock, setProductStock] = useState("");

  // OFFER_RENTAL
  const [rentalFeeTime, setRentalFeeTime] = useState("");
  const [rentalFeeGaras, setRentalFeeGaras] = useState("");
  const [rentalMaxDuration, setRentalMaxDuration] = useState("");
  const [rentalDeposit, setRentalDeposit] = useState(false);

  // RIDE_SHARE
  const [rideStart, setRideStart] = useState("");
  const [rideDestination, setRideDestination] = useState("");
  const [rideDeparture, setRideDeparture] = useState("");
  const [rideSeats, setRideSeats] = useState("");
  const [ridePriceTime, setRidePriceTime] = useState("");
  const [ridePriceGaras, setRidePriceGaras] = useState("");

  // EVENT_WORKSHOP
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState("");
  const [eventPriceTime, setEventPriceTime] = useState("");
  const [eventPriceGaras, setEventPriceGaras] = useState("");

  // SEARCH_SERVICE
  const [searchServiceDeadline, setSearchServiceDeadline] = useState("");

  // SEARCH_PRODUCT
  const [searchProductDeadline, setSearchProductDeadline] = useState("");

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
    const notes = priceNotes.trim() || undefined;
    switch (category) {
      case "OFFER_SERVICE":
        return { time_factor: timeFactor, price_notes: notes };
      case "SEARCH_SERVICE":
        return {
          deadline: searchServiceDeadline || undefined,
          price_notes: notes,
        };
      case "SELL_PRODUCT":
        return {
          time_amount: parseInt(productTime),
          regio_amount: productGaras ? parseInt(productGaras) : undefined,
          condition: productCondition,
          stock: productStock ? parseInt(productStock) : undefined,
          price_notes: notes,
        };
      case "SEARCH_PRODUCT":
        return {
          urgency_deadline: searchProductDeadline || undefined,
          price_notes: notes,
        };
      case "OFFER_RENTAL":
        return {
          handling_fee_time: rentalFeeTime ? parseInt(rentalFeeTime) : undefined,
          usage_fee_regio: rentalFeeGaras ? parseInt(rentalFeeGaras) : undefined,
          max_rental_duration: rentalMaxDuration || undefined,
          deposit_required: rentalDeposit || undefined,
          price_notes: notes,
        };
      case "RIDE_SHARE":
        return {
          from_location: rideStart,
          to_location: rideDestination,
          departure_datetime: rideDeparture || undefined,
          seats_available: rideSeats ? parseInt(rideSeats) : undefined,
          price_time: ridePriceTime ? parseInt(ridePriceTime) : undefined,
          price_regio: ridePriceGaras ? parseInt(ridePriceGaras) : undefined,
          price_notes: notes,
        };
      case "EVENT_WORKSHOP":
        return {
          event_start_date: eventStart,
          event_end_date: eventEnd,
          location: eventLocation || undefined,
          max_participants: eventMaxParticipants ? parseInt(eventMaxParticipants) : undefined,
          price_time: eventPriceTime ? parseInt(eventPriceTime) : undefined,
          price_regio: eventPriceGaras ? parseInt(eventPriceGaras) : undefined,
          price_notes: notes,
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
        return !!(productTime && parseInt(productTime) > 0);
      case "OFFER_RENTAL":
        return !!(rentalFeeTime || rentalFeeGaras);
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
        setPriceNotes("");
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

          {/* OFFER_SERVICE */}
          {category === "OFFER_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>
                Time Factor <span className="text-[#999] font-normal">(0.25 – 3.0)</span>
              </label>
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
                {timeFactor}x — final cost = hours worked × {timeFactor}
              </div>
            </div>
          )}

          {/* SEARCH_SERVICE */}
          {category === "SEARCH_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>Deadline (optional)</label>
              <input
                type="date"
                value={searchServiceDeadline}
                onChange={(e) => setSearchServiceDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* SELL_PRODUCT */}
          {category === "SELL_PRODUCT" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    Price in Time (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productTime}
                    onChange={(e) => setProductTime(e.target.value)}
                    placeholder="e.g. 30"
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">Required. Products must include labor.</div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Price in Garas (optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={productGaras}
                    onChange={(e) => setProductGaras(e.target.value)}
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Condition</label>
                  <select
                    className={inputClass}
                    value={productCondition}
                    onChange={(e) => setProductCondition(e.target.value as "NEW" | "USED")}
                  >
                    <option value="NEW">New</option>
                    <option value="USED">Used</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Stock / Quantity (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder="e.g. 3"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* SEARCH_PRODUCT */}
          {category === "SEARCH_PRODUCT" && (
            <div className={fieldClass}>
              <label className={labelClass}>Deadline / Urgency (optional)</label>
              <input
                type="date"
                value={searchProductDeadline}
                onChange={(e) => setSearchProductDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* OFFER_RENTAL */}
          {category === "OFFER_RENTAL" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Handling Fee (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={rentalFeeTime}
                    onChange={(e) => setRentalFeeTime(e.target.value)}
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">Effort to hand over</div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Usage Fee (Garas)</label>
                  <input
                    type="number"
                    min="0"
                    value={rentalFeeGaras}
                    onChange={(e) => setRentalFeeGaras(e.target.value)}
                    placeholder="e.g. 2"
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">Wear & tear</div>
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Max Duration (optional)</label>
                  <input
                    type="text"
                    value={rentalMaxDuration}
                    onChange={(e) => setRentalMaxDuration(e.target.value)}
                    placeholder="e.g. 1 week"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="deposit"
                    checked={rentalDeposit}
                    onChange={(e) => setRentalDeposit(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="deposit" className={cn(labelClass, "mb-0 cursor-pointer")}>
                    Deposit required
                  </label>
                </div>
              </div>
            </>
          )}

          {/* RIDE_SHARE */}
          {category === "RIDE_SHARE" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>From</label>
                  <input
                    type="text"
                    value={rideStart}
                    onChange={(e) => setRideStart(e.target.value)}
                    placeholder="e.g. Munich"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>To</label>
                  <input
                    type="text"
                    value={rideDestination}
                    onChange={(e) => setRideDestination(e.target.value)}
                    placeholder="e.g. Berlin"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    value={rideDeparture}
                    onChange={(e) => setRideDeparture(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Available Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={rideSeats}
                    onChange={(e) => setRideSeats(e.target.value)}
                    placeholder="e.g. 3"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Price per Seat (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={ridePriceTime}
                    onChange={(e) => setRidePriceTime(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Price per Seat (Garas)</label>
                  <input
                    type="number"
                    min="0"
                    value={ridePriceGaras}
                    onChange={(e) => setRidePriceGaras(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* EVENT_WORKSHOP */}
          {category === "EVENT_WORKSHOP" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Community Hall, Room 3"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Max Participants (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(e.target.value)}
                    placeholder="e.g. 20"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>Entry Fee (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={eventPriceTime}
                    onChange={(e) => setEventPriceTime(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Material Fee (Garas)</label>
                  <input
                    type="number"
                    min="0"
                    value={eventPriceGaras}
                    onChange={(e) => setEventPriceGaras(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* Payment / Price Notes — all categories */}
          <div className={fieldClass}>
            <label className={labelClass}>Payment / Price Notes (optional)</label>
            <textarea
              className={cn(inputClass, "h-[60px] resize-none")}
              placeholder="e.g. Material costs depend on brand. Price per day."
              value={priceNotes}
              onChange={(e) => setPriceNotes(e.target.value)}
            />
          </div>

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
