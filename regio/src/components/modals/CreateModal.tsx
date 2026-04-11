"use client";

import React, { useState } from "react";
import { FaSpinner, FaImage, FaXmark, FaMapLocationDot } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingCategory, ListingCreate } from "@/lib/api/types";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { useCreateListing } from "@/lib/api/hooks/use-listings";
import { uploadMedia } from "@/lib/api/modules/listings";
import { useLanguage } from "@/context/LanguageContext";
import LocationPicker from "@/components/map/LocationPicker";

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

  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

  const createMutation = useCreateListing();
  const { t } = useLanguage();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []).filter(
      f => f.size <= 1 * 1024 * 1024
    );
    const combined = [...selectedFiles, ...incoming].slice(0, 5);
    setSelectedFiles(combined);
    setPreviewUrls(combined.map(f => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(next);
    setPreviewUrls(next.map(f => URL.createObjectURL(f)));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setPriceNotes("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setLocationLat(null);
    setLocationLng(null);
    setShowMap(false);
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    const payload: ListingCreate = {
      title,
      description,
      category,
      tags,
      attributes: buildAttributes(),
      location_lat: locationLat ?? undefined,
      location_lng: locationLng ?? undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: async (createdListing) => {
        if (selectedFiles.length > 0) {
          setIsUploading(true);
          try {
            await uploadMedia(createdListing.id, selectedFiles);
          } finally {
            setIsUploading(false);
          }
        }
        resetForm();
        onClose();
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
            {t.create_modal.title}
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
            <label className={labelClass}>{t.create_modal.category_label}</label>
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
            <label className={labelClass}>{t.create_modal.title_label}</label>
            <input
              type="text"
              className={cn(
                inputClass,
                title.length >= 80 ? "border-[var(--color-red-search)]" : ""
              )}
              placeholder={t.create_modal.title_placeholder}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[11px] text-[#888] mt-[4px]">
              {t.create_modal.title_counter.replace('{count}', String(title.length))}
            </div>
          </div>

          {/* Description */}
          <div className={fieldClass}>
            <label className={labelClass}>{t.create_modal.description_label}</label>
            <textarea
              className={cn(inputClass, "h-[80px] resize-none")}
              placeholder={t.create_modal.description_placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Category-specific fields ── */}

          {/* OFFER_SERVICE */}
          {category === "OFFER_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>
                {t.create_modal.offer_service.time_factor_label} <span className="text-[#999] font-normal">{t.create_modal.offer_service.time_factor_hint}</span>
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
                {t.create_modal.offer_service.time_factor_description.replace('{factor}', String(timeFactor))}
              </div>
            </div>
          )}

          {/* SEARCH_SERVICE */}
          {category === "SEARCH_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>{t.create_modal.search_service.deadline_label}</label>
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
                    {t.create_modal.sell_product.price_time_label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productTime}
                    onChange={(e) => setProductTime(e.target.value)}
                    placeholder={t.create_modal.sell_product.price_time_placeholder}
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">{t.create_modal.sell_product.price_time_required_hint}</div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.sell_product.price_garas_label}</label>
                  <input
                    type="number"
                    min="0"
                    value={productGaras}
                    onChange={(e) => setProductGaras(e.target.value)}
                    placeholder={t.create_modal.sell_product.price_garas_placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.sell_product.condition_label}</label>
                  <select
                    className={inputClass}
                    value={productCondition}
                    onChange={(e) => setProductCondition(e.target.value as "NEW" | "USED")}
                  >
                    <option value="NEW">{t.create_modal.sell_product.condition_new}</option>
                    <option value="USED">{t.create_modal.sell_product.condition_used}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.sell_product.stock_label}</label>
                  <input
                    type="number"
                    min="1"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder={t.create_modal.sell_product.stock_placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* SEARCH_PRODUCT */}
          {category === "SEARCH_PRODUCT" && (
            <div className={fieldClass}>
              <label className={labelClass}>{t.create_modal.search_product.deadline_label}</label>
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
                  <label className={labelClass}>{t.create_modal.offer_rental.handling_fee_label}</label>
                  <input
                    type="number"
                    min="0"
                    value={rentalFeeTime}
                    onChange={(e) => setRentalFeeTime(e.target.value)}
                    placeholder={t.create_modal.offer_rental.handling_fee_placeholder}
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">{t.create_modal.offer_rental.handling_fee_hint}</div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.offer_rental.usage_fee_label}</label>
                  <input
                    type="number"
                    min="0"
                    value={rentalFeeGaras}
                    onChange={(e) => setRentalFeeGaras(e.target.value)}
                    placeholder={t.create_modal.offer_rental.usage_fee_placeholder}
                    className={inputClass}
                  />
                  <div className="text-[11px] text-[#888] mt-1">{t.create_modal.offer_rental.usage_fee_hint}</div>
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.offer_rental.max_duration_label}</label>
                  <input
                    type="text"
                    value={rentalMaxDuration}
                    onChange={(e) => setRentalMaxDuration(e.target.value)}
                    placeholder={t.create_modal.offer_rental.max_duration_placeholder}
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
                    {t.create_modal.offer_rental.deposit_label}
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
                  <label className={labelClass}>{t.create_modal.ride_share.from_label}</label>
                  <input
                    type="text"
                    value={rideStart}
                    onChange={(e) => setRideStart(e.target.value)}
                    placeholder={t.create_modal.ride_share.from_placeholder}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.to_label}</label>
                  <input
                    type="text"
                    value={rideDestination}
                    onChange={(e) => setRideDestination(e.target.value)}
                    placeholder={t.create_modal.ride_share.to_placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.departure_label}</label>
                  <input
                    type="datetime-local"
                    value={rideDeparture}
                    onChange={(e) => setRideDeparture(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.seats_label}</label>
                  <input
                    type="number"
                    min="1"
                    value={rideSeats}
                    onChange={(e) => setRideSeats(e.target.value)}
                    placeholder={t.create_modal.ride_share.seats_placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.price_time_label}</label>
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
                  <label className={labelClass}>{t.create_modal.ride_share.price_garas_label}</label>
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
                  <label className={labelClass}>{t.create_modal.event_workshop.start_label}</label>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.end_label}</label>
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
                  <label className={labelClass}>{t.create_modal.event_workshop.location_label}</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t.create_modal.event_workshop.location_placeholder}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.max_participants_label}</label>
                  <input
                    type="number"
                    min="1"
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(e.target.value)}
                    placeholder={t.create_modal.event_workshop.max_participants_placeholder}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.entry_fee_label}</label>
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
                  <label className={labelClass}>{t.create_modal.event_workshop.material_fee_label}</label>
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
            <label className={labelClass}>{t.create_modal.price_notes_label}</label>
            <textarea
              className={cn(inputClass, "h-[60px] resize-none")}
              placeholder={t.create_modal.price_notes_placeholder}
              value={priceNotes}
              onChange={(e) => setPriceNotes(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className={fieldClass}>
            <label className={labelClass}>{t.create_modal.tags_label}</label>
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
                placeholder={t.create_modal.tags_placeholder}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {/* Location */}
          <div className={fieldClass}>
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-[6px] text-[13px] text-[#555] bg-[#f0f0f0] border border-[#ccc] rounded-[4px] px-[12px] py-[8px] hover:bg-[#e8e8e8] transition-colors"
            >
              <FaMapLocationDot className="text-[14px]" />
              {showMap ? "Hide map" : locationLat !== null ? `Location set: ${locationLat.toFixed(4)}, ${locationLng!.toFixed(4)}` : "Add location on map"}
            </button>

            {showMap && (
              <div className="mt-[10px]">
                <LocationPicker
                  lat={locationLat}
                  lng={locationLng}
                  onLocationSelect={(lat, lng) => {
                    setLocationLat(lat);
                    setLocationLng(lng);
                  }}
                  onClear={() => {
                    setLocationLat(null);
                    setLocationLng(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Photos */}
          <div className={fieldClass}>
            <label className={labelClass}>{t.create_modal.images_label}</label>
            <p className="text-[11px] text-[#888] mb-[8px]">{t.create_modal.images_hint}</p>

            {previewUrls.length > 0 && (
              <div className="flex gap-[8px] flex-wrap mb-[10px]">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative w-[80px] h-[80px]">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-[4px] border border-[#ddd]"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-[6px] -right-[6px] w-[18px] h-[18px] bg-[#333] text-white rounded-full text-[10px] flex items-center justify-center hover:bg-[#555]"
                    >
                      <FaXmark />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length < 5 && (
              <label className="inline-flex items-center gap-[6px] cursor-pointer bg-[#f0f0f0] border border-[#ccc] rounded-[4px] px-[12px] py-[8px] text-[13px] text-[#555] hover:bg-[#e8e8e8] transition-colors">
                <FaImage className="text-[14px]" />
                {t.create_modal.images_add}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>

          {createMutation.isError && (
            <p className="text-[12px] text-red-500 mt-1">
              {t.create_modal.error_failed}
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
              {t.create_modal.cancel_button}
            </button>
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[var(--color-green-offer)] text-white flex justify-center items-center gap-2 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={createMutation.isPending || isUploading || !isValid()}
            >
              {(createMutation.isPending || isUploading) && (
                <FaSpinner className="animate-spin" />
              )}
              {isUploading
                ? t.create_modal.images_uploading
                : createMutation.isPending
                ? t.create_modal.submit_loading
                : t.create_modal.submit_button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
