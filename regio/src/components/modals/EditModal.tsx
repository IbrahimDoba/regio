"use client";

import React, { useState } from "react";
import { FaSpinner, FaImage, FaXmark, FaPencil, FaClock } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingPublic, ListingUpdate } from "@/lib/api/types";
import { getCategoryDetails } from "@/lib/feed-helpers";
import { ListingAttributes } from "@/lib/feed-helpers";
import { useUpdateListing } from "@/lib/api/hooks/use-listings";
import { useLanguage } from "@/context/LanguageContext";
import { appendEditLog, EditLogEntry } from "@/lib/listingEditLog";

interface EditModalProps {
  listing: ListingPublic;
  onClose: () => void;
}

const selectItemClass =
  "flex-1 min-w-0 p-[10px] border border-[#ccc] rounded-[4px] text-[15px] bg-[var(--input-bg)] cursor-pointer";

function DateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const initParts = value ? value.split("-") : [];
  const [selYear, setSelYear] = useState(initParts[0] || "");
  const [selMonth, setSelMonth] = useState(initParts[1] || "");
  const [selDay, setSelDay] = useState(initParts[2] || "");

  const maxDay =
    selYear && selMonth ? new Date(+selYear, +selMonth, 0).getDate() : 31;

  const emit = (y: string, m: string, d: string) => {
    if (y && m && d)
      onChange(
        `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
      );
    else onChange("");
  };

  const onYear = (v: string) => {
    setSelYear(v);
    emit(v, selMonth, selDay);
  };
  const onMonth = (v: string) => {
    const max = selYear && v ? new Date(+selYear, +v, 0).getDate() : 31;
    const nd = selDay && +selDay > max ? "" : selDay;
    setSelMonth(v);
    setSelDay(nd);
    emit(selYear, v, nd);
  };
  const onDay = (v: string) => {
    setSelDay(v);
    emit(selYear, selMonth, v);
  };

  return (
    <div className="flex gap-1 w-full">
      <select
        value={selYear}
        onChange={(e) => onYear(e.target.value)}
        className={selectItemClass}
      >
        <option value="">Year</option>
        {Array.from({ length: 7 }, (_, i) => currentYear + i).map((yr) => (
          <option key={yr} value={String(yr)}>
            {yr}
          </option>
        ))}
      </select>
      <select
        value={selMonth}
        onChange={(e) => onMonth(e.target.value)}
        className={selectItemClass}
      >
        <option value="">Month</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => (
          <option key={mo} value={String(mo).padStart(2, "0")}>
            {String(mo).padStart(2, "0")}
          </option>
        ))}
      </select>
      <select
        value={selDay}
        onChange={(e) => onDay(e.target.value)}
        className={selectItemClass}
      >
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
          <option key={day} value={String(day).padStart(2, "0")}>
            {String(day).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}

function buildInitialAttrs(listing: ListingPublic) {
  const a = (listing.attributes ?? {}) as ListingAttributes;
  return {
    timeFactor: String(a.time_factor ?? 1.0),
    productTime: String(a.time_amount ?? ""),
    productGaras: String(a.regio_amount ?? ""),
    productCondition: (a.condition as "NEW" | "USED") ?? "NEW",
    productStock: String(a.stock ?? ""),
    rentalFeeTime: String(a.handling_fee_time ?? ""),
    rentalFeeGaras: String(a.usage_fee_regio ?? ""),
    rentalMaxDuration: a.max_rental_duration ?? "",
    rentalDeposit: a.deposit_required ?? false,
    rideStart: a.from_location ?? "",
    rideDestination: a.to_location ?? "",
    rideDeparture: a.departure_datetime ?? "",
    rideSeats: String(a.seats_available ?? ""),
    ridePriceTime: String(a.price_time ?? ""),
    ridePriceGaras: String(a.price_regio ?? ""),
    eventStart: a.event_start_date ?? "",
    eventEnd: a.event_end_date ?? "",
    eventLocation: a.location ?? "",
    eventMaxParticipants: String(a.max_participants ?? ""),
    eventPriceTime: String(a.price_time ?? ""),
    eventPriceGaras: String(a.price_regio ?? ""),
    searchServiceDeadline: a.deadline ?? "",
    searchProductDeadline: a.urgency_deadline ?? "",
    priceNotes: a.price_notes ?? "",
  };
}

export default function EditModal({ listing, onClose }: EditModalProps) {
  const { t } = useLanguage();
  const updateMutation = useUpdateListing();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [tags, setTags] = useState<string[]>(listing.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const init = buildInitialAttrs(listing);
  const [timeFactor, setTimeFactor] = useState(init.timeFactor);
  const [productTime, setProductTime] = useState(init.productTime);
  const [productGaras, setProductGaras] = useState(init.productGaras);
  const [productCondition, setProductCondition] = useState<"NEW" | "USED">(
    init.productCondition
  );
  const [productStock, setProductStock] = useState(init.productStock);
  const [rentalFeeTime, setRentalFeeTime] = useState(init.rentalFeeTime);
  const [rentalFeeGaras, setRentalFeeGaras] = useState(init.rentalFeeGaras);
  const [rentalMaxDuration, setRentalMaxDuration] = useState(
    init.rentalMaxDuration
  );
  const [rentalDeposit, setRentalDeposit] = useState(init.rentalDeposit);
  const [rideStart, setRideStart] = useState(init.rideStart);
  const [rideDestination, setRideDestination] = useState(init.rideDestination);
  const [rideDeparture, setRideDeparture] = useState(init.rideDeparture);
  const [rideSeats, setRideSeats] = useState(init.rideSeats);
  const [ridePriceTime, setRidePriceTime] = useState(init.ridePriceTime);
  const [ridePriceGaras, setRidePriceGaras] = useState(init.ridePriceGaras);
  const [eventStart, setEventStart] = useState(init.eventStart);
  const [eventEnd, setEventEnd] = useState(init.eventEnd);
  const [eventLocation, setEventLocation] = useState(init.eventLocation);
  const [eventMaxParticipants, setEventMaxParticipants] = useState(
    init.eventMaxParticipants
  );
  const [eventPriceTime, setEventPriceTime] = useState(init.eventPriceTime);
  const [eventPriceGaras, setEventPriceGaras] = useState(init.eventPriceGaras);
  const [searchServiceDeadline, setSearchServiceDeadline] = useState(
    init.searchServiceDeadline
  );
  const [searchProductDeadline, setSearchProductDeadline] = useState(
    init.searchProductDeadline
  );
  const [priceNotes, setPriceNotes] = useState(init.priceNotes);

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
    switch (listing.category) {
      case "OFFER_SERVICE":
        return { time_factor: parseFloat(timeFactor), price_notes: notes };
      case "SEARCH_SERVICE":
        return {
          deadline: searchServiceDeadline || undefined,
          price_notes: notes,
        };
      case "SELL_PRODUCT":
        return {
          time_amount: productTime ? parseInt(productTime) : undefined,
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
          max_participants: eventMaxParticipants
            ? parseInt(eventMaxParticipants)
            : undefined,
          price_time: eventPriceTime ? parseInt(eventPriceTime) : undefined,
          price_regio: eventPriceGaras ? parseInt(eventPriceGaras) : undefined,
          price_notes: notes,
        };
      default:
        return {};
    }
  };

  const computeDiff = (newAttrs: Record<string, unknown>): EditLogEntry[] => {
    const entries: EditLogEntry[] = [];
    const ts = new Date().toISOString();
    const oldAttrs = (listing.attributes ?? {}) as Record<string, unknown>;

    if (title !== listing.title)
      entries.push({ ts, field: "title", from: listing.title, to: title });
    if (description !== listing.description)
      entries.push({
        ts,
        field: "description",
        from: listing.description,
        to: description,
      });
    if (JSON.stringify(tags) !== JSON.stringify(listing.tags ?? []))
      entries.push({
        ts,
        field: "tags",
        from: (listing.tags ?? []).join(", "),
        to: tags.join(", "),
      });

    for (const key of Object.keys(newAttrs)) {
      const oldVal = oldAttrs[key] ?? null;
      const newVal = newAttrs[key] ?? null;
      if (String(oldVal) !== String(newVal)) {
        entries.push({
          ts,
          field: `attributes.${key}`,
          from: oldVal as string | number | boolean | null,
          to: newVal as string | number | boolean | null,
        });
      }
    }

    return entries;
  };

  const isValid = () => title.length >= 5 && description.length >= 20;

  const handleSubmit = () => {
    if (!isValid()) return;
    const newAttrs = buildAttributes();
    const diff = computeDiff(newAttrs);

    const payload: ListingUpdate = {
      title,
      description,
      tags,
      attributes: newAttrs,
    };

    updateMutation.mutate(
      { listingId: listing.id, data: payload },
      {
        onSuccess: () => {
          appendEditLog(listing.id, diff);
          onClose();
        },
      }
    );
  };

  const inputClass =
    "w-full p-[12px] border border-[#ccc] rounded-[4px] text-[16px] bg-[var(--input-bg)]";
  const labelClass = "text-[14px] font-[700] text-[#555] block mb-[6px]";
  const fieldClass = "mb-[15px]";

  const { icon: catIcon, colorVar: catColorVar } =
    getCategoryDetails(listing.category);
  const catLabel = t.category_labels[listing.category];

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1001] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] p-0 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-[15px] border-b border-[#eee] flex justify-between items-center bg-[#f9f9f9]">
          <div className="flex items-center gap-2 text-[18px] font-[700] text-[#333]">
            <FaPencil className="text-[14px] text-[#888]" />
            {t.create_modal.title}
          </div>
          <div
            className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]"
            onClick={onClose}
          >
            &times;
          </div>
        </div>

        {/* Category banner (read-only) */}
        <div
          className="flex items-center gap-[16px] px-[20px] py-[14px] border-b-[3px]"
          style={{
            borderBottomColor: catColorVar,
            backgroundColor: `color-mix(in srgb, ${catColorVar} 8%, white)`,
          }}
        >
          <img
            src={catIcon}
            alt={catLabel}
            className="w-[44px] h-[44px] object-contain"
          />
          <span
            className="text-[20px] font-[800] uppercase tracking-wider"
            style={{ color: catColorVar }}
          >
            {catLabel}
          </span>
        </div>

        <div className="p-[20px] overflow-y-auto flex-grow">
          {/* Title */}
          <div className={fieldClass}>
            <label className={labelClass}>{t.create_modal.title_label}</label>
            <input
              type="text"
              className={cn(
                inputClass,
                title.length >= 80 ? "border-[var(--color-red-search)]" : ""
              )}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[13px] text-[#888] mt-[4px]">
              {t.create_modal.title_counter.replace("{count}", String(title.length))}
            </div>
          </div>

          {/* Description */}
          <div className={fieldClass}>
            <label className={labelClass}>
              {t.create_modal.description_label}
            </label>
            <textarea
              className={cn(inputClass, "h-[80px] resize-none")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* OFFER_SERVICE */}
          {listing.category === "OFFER_SERVICE" && (
            <div className={fieldClass}>
              <div className="flex justify-between items-center mb-2">
                <label className={labelClass}>
                  {t.create_modal.offer_service.time_factor_label}
                  <span className="text-[#999] font-normal ml-1">(0.25 – 3.0)</span>
                </label>
                <div className="flex items-center gap-1.5 bg-[#f0f0f0] rounded-[6px] px-2.5 py-1 shrink-0">
                  <span className="text-[14px] font-[800] text-[#333]">{timeFactor}x</span>
                  <FaClock className="text-[#888] text-[12px]" />
                </div>
              </div>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.25"
                value={timeFactor}
                onChange={(e) => setTimeFactor(e.target.value)}
                className="w-full cursor-pointer accent-[#e05555]"
              />
              <div className="text-[12px] text-[#888] mt-1.5 italic">
                {t.create_modal.offer_service.time_factor_description.replace(
                  "{factor}",
                  timeFactor
                )}
              </div>
            </div>
          )}

          {/* SEARCH_SERVICE */}
          {listing.category === "SEARCH_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>
                {t.create_modal.search_service.deadline_label}
              </label>
              <DateSelect
                value={searchServiceDeadline}
                onChange={setSearchServiceDeadline}
              />
            </div>
          )}

          {/* SELL_PRODUCT */}
          {listing.category === "SELL_PRODUCT" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.sell_product.price_time_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/time.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="1"
                      value={productTime}
                      onChange={(e) => setProductTime(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.sell_product.price_garas_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/garas.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={productGaras}
                      onChange={(e) => setProductGaras(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.sell_product.condition_label}
                  </label>
                  <select
                    className={inputClass}
                    value={productCondition}
                    onChange={(e) =>
                      setProductCondition(e.target.value as "NEW" | "USED")
                    }
                  >
                    <option value="NEW">
                      {t.create_modal.sell_product.condition_new}
                    </option>
                    <option value="USED">
                      {t.create_modal.sell_product.condition_used}
                    </option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.sell_product.stock_label}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* SEARCH_PRODUCT */}
          {listing.category === "SEARCH_PRODUCT" && (
            <div className={fieldClass}>
              <label className={labelClass}>
                {t.create_modal.search_product.deadline_label}
              </label>
              <DateSelect
                value={searchProductDeadline}
                onChange={setSearchProductDeadline}
              />
            </div>
          )}

          {/* OFFER_RENTAL */}
          {listing.category === "OFFER_RENTAL" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.offer_rental.handling_fee_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/time.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={rentalFeeTime}
                      onChange={(e) => setRentalFeeTime(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.offer_rental.usage_fee_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/garas.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={rentalFeeGaras}
                      onChange={(e) => setRentalFeeGaras(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.offer_rental.max_duration_label}
                  </label>
                  <input
                    type="text"
                    value={rentalMaxDuration}
                    onChange={(e) => setRentalMaxDuration(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="edit-deposit"
                    checked={rentalDeposit}
                    onChange={(e) => setRentalDeposit(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="edit-deposit"
                    className={cn(labelClass, "mb-0 cursor-pointer")}
                  >
                    {t.create_modal.offer_rental.deposit_label}
                  </label>
                </div>
              </div>
            </>
          )}

          {/* RIDE_SHARE */}
          {listing.category === "RIDE_SHARE" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.ride_share.from_label}
                  </label>
                  <input
                    type="text"
                    value={rideStart}
                    onChange={(e) => setRideStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.ride_share.to_label}
                  </label>
                  <input
                    type="text"
                    value={rideDestination}
                    onChange={(e) => setRideDestination(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.ride_share.seats_label}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rideSeats}
                    onChange={(e) => setRideSeats(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.ride_share.price_time_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/time.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={ridePriceTime}
                      onChange={(e) => setRidePriceTime(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* EVENT_WORKSHOP */}
          {listing.category === "EVENT_WORKSHOP" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.start_label}
                  </label>
                  <input
                    type="text"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className={inputClass}
                    placeholder="YYYY-MM-DDTHH:MM"
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.end_label}
                  </label>
                  <input
                    type="text"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className={inputClass}
                    placeholder="YYYY-MM-DDTHH:MM"
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.location_label}
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.max_participants_label}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.entry_fee_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/time.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={eventPriceTime}
                      onChange={(e) => setEventPriceTime(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>
                    {t.create_modal.event_workshop.material_fee_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src="/garas.png"
                      className="w-[44px] h-[44px] flex-shrink-0"
                      alt=""
                    />
                    <input
                      type="number"
                      min="0"
                      value={eventPriceGaras}
                      onChange={(e) => setEventPriceGaras(e.target.value)}
                      className={cn(inputClass, "flex-1")}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Price notes — all categories */}
          <div className={fieldClass}>
            <label className={labelClass}>
              {t.create_modal.price_notes_label}
            </label>
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
                  className="bg-[#e0e0e0] rounded-[12px] p-[4px_12px] text-[14px] flex items-center gap-[5px]"
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
                className="border-none outline-none bg-transparent text-[16px] flex-grow p-[5px]"
                placeholder={t.create_modal.tags_placeholder}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {updateMutation.isError && (
            <p className="text-[12px] text-red-500 mt-1">
              {t.create_modal.error_failed}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-[15px] border-t border-[#eee] bg-white">
          <div className="flex gap-[10px]">
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[#ddd] text-[#333]"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              {t.create_modal.cancel_button}
            </button>
            <button
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer bg-[var(--color-green-offer)] text-white flex justify-center items-center gap-2 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={updateMutation.isPending || !isValid()}
            >
              {updateMutation.isPending && (
                <FaSpinner className="animate-spin" />
              )}
              {updateMutation.isPending
                ? t.preview_modal.modify_loading
                : t.preview_modal.modify_button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
