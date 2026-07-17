"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaSpinner, FaImage, FaXmark, FaCalendarDays,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { DClass, ListingCategory, ListingCreate, TagAutocomplete } from "@/lib/api/types";
import { CATEGORY_CONFIG, getCategoryDetails } from "@/lib/feed-helpers";
import { useCreateListing, useSearchTags } from "@/lib/api/hooks/use-listings";
import { uploadMedia } from "@/lib/api/modules/listings";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";


/** Max available_until = today + 62 days (~2 months) */
function getMaxAvailableUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 62);
  return d.toISOString().slice(0, 10);
}

function FormattedNumberInput({
  value, onChange, format, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  format: "time" | "garas";
  placeholder?: string;
  className?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const { language } = useLanguage();

  const getFormatted = (v: string) => {
    const num = parseFloat(v);
    if (!v || isNaN(num)) return "";
    if (format === "time") {
      const unit = language === "HU" ? "perc" : "min";
      return `${Math.round(num)} ${unit}`;
    }
    return `${num.toFixed(2).replace(".", ",")} G`;
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isFocused ? value : getFormatted(value)}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      onFocus={(e) => { setIsFocused(true); e.target.select(); }}
      onBlur={() => setIsFocused(false)}
    />
  );
}




interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const dialog = useDialog();
  const createMutation = useCreateListing();

  const [category, setCategory] = useState<ListingCategory>("OFFER_SERVICE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [priceNotes, setPriceNotes] = useState("");

  // Location & Visibility (new system)
  const [zipCode, setZipCode] = useState(user?.zip_code ?? "");
  const [dClass, setDClass] = useState<DClass>("D3");
  const [availableUntil, setAvailableUntil] = useState("");
  const availableUntilRef = useRef<HTMLInputElement>(null);

  // Pre-fill ZIP from user profile
  useEffect(() => {
    if (user?.zip_code) setZipCode(user.zip_code);
  }, [user?.zip_code]);

  useModalKeyboard(onClose, undefined, isOpen);

  // OFFER_SERVICE
  const [timeFactor, setTimeFactor] = useState(1.0);

  // SELL_PRODUCT
  const [productCondition, setProductCondition] = useState<"NEW" | "USED">("NEW");
  const [productStock, setProductStock] = useState("");
  const [productTime, setProductTime] = useState("");
  const [productGaras, setProductGaras] = useState("");

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

  // SEARCH_SERVICE / SEARCH_PRODUCT
  const [searchServiceDeadline, setSearchServiceDeadline] = useState("");
  const [searchProductDeadline, setSearchProductDeadline] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [debouncedTagInput, setDebouncedTagInput] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagDisplayLabels, setTagDisplayLabels] = useState<Record<string, string>>({});
  // Tags added here that the API doesn't recognize as official — warned about before submit
  const [unofficialTags, setUnofficialTags] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const { data: tagSuggestionData } = useSearchTags(debouncedTagInput);
  const tagSuggestionsList = (tagSuggestionData ?? []).filter((s) => !tags.includes(s.name));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTagInput(tagInput), 300);
    return () => clearTimeout(timer);
  }, [tagInput]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isOpen) return null;

  const markUnofficial = (name: string) =>
    setUnofficialTags((prev) => (prev.includes(name) ? prev : [...prev, name]));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(",", "");
      if (!val) return;

      // Typed text that matches a known tag resolves to it, so a user typing a
      // tag's own localized label doesn't create a duplicate of it.
      const match = tagSuggestionsList.find(
        (s) =>
          s.label.toLowerCase() === val.toLowerCase() ||
          s.name.toLowerCase() === val.toLowerCase()
      );
      if (match) {
        handleSelectTagSuggestion(match);
        return;
      }

      if (!tags.includes(val)) {
        setTags([...tags, val]);
        markUnofficial(val);
      }
      setTagInput("");
      setShowTagDropdown(false);
    } else if (e.key === "Escape") {
      setShowTagDropdown(false);
    }
  };

  const handleSelectTagSuggestion = (tag: TagAutocomplete) => {
    if (!tags.includes(tag.name)) {
      setTags([...tags, tag.name]);
      setTagDisplayLabels((prev) => ({ ...prev, [tag.name]: tag.label }));
      if (!tag.is_official) markUnofficial(tag.name);
    }
    setTagInput("");
    setDebouncedTagInput("");
    setShowTagDropdown(false);
  };

  const removeTag = (index: number) => {
    const name = tags[index];
    setTags(tags.filter((_, i) => i !== index));
    setUnofficialTags((prev) => prev.filter((t) => t !== name));
  };

  const buildAttributes = (): Record<string, unknown> => {
    const notes = priceNotes.trim() || undefined;
    switch (category) {
      case "OFFER_SERVICE":
        return { time_factor: timeFactor, price_notes: notes };
      case "SEARCH_SERVICE":
        return { deadline: searchServiceDeadline || undefined, price_notes: notes };
      case "SELL_PRODUCT":
        return {
          time_amount: productTime ? parseInt(productTime) : undefined,
          regio_amount: productGaras ? parseInt(productGaras) : undefined,
          condition: productCondition,
          stock: productStock ? parseInt(productStock) : undefined,
          price_notes: notes,
        };
      case "SEARCH_PRODUCT":
        return { urgency_deadline: searchProductDeadline || undefined, price_notes: notes };
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
    if (!title || title.length < 2) return false;
    if (!description) return false;
    if (isSearchCategory || category === "SELL_PRODUCT") {
      if (tags.length === 0) return false;
      if (!zipCode.trim()) return false;
    }
    if (category === "SELL_PRODUCT") {
      if (!productTime) return false;
      if (!productStock) return false;
    }
    switch (category) {
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
    const incoming = Array.from(e.target.files || []).filter(f => f.size <= 1 * 1024 * 1024);
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
    setTitle(""); setDescription(""); setTags([]); setPriceNotes("");
    setSelectedFiles([]); setPreviewUrls([]);
    setAvailableUntil("");
    setTagInput(""); setUnofficialTags([]); setTagDisplayLabels({});
    // Keep ZIP and D-class — user likely wants the same for next listing
  };

  /** Tags the user added that aren't official yet — they go to the admin for review. */
  const pendingUnofficialTags = unofficialTags.filter((name) => tags.includes(name));

  const confirmUnofficialTags = async (): Promise<boolean> => {
    if (pendingUnofficialTags.length === 0) return true;
    setIsConfirming(true);
    try {
      return await dialog.confirm(
        t.create_modal.unofficial_tags_title,
        t.create_modal.unofficial_tags_body
          .replace("{count}", String(pendingUnofficialTags.length))
          .replace(
            "{tags}",
            pendingUnofficialTags.map((n) => tagDisplayLabels[n] ?? n).join(", ")
          )
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid() || isConfirming) return;
    if (!(await confirmUnofficialTags())) return;

    const payload: ListingCreate = {
      title,
      description,
      category,
      tags,
      zip_code: zipCode.trim() || null,
      d_class: dClass,
      available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
      attributes: buildAttributes(),
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

  const isSearchCategory = category === "SEARCH_SERVICE" || category === "SEARCH_PRODUCT";
  const isSellProduct = category === "SELL_PRODUCT";
  const inputClass = "w-full p-[12px] border border-[#ccc] rounded-[4px] text-[16px] bg-[var(--input-bg)]";
  const labelClass = "text-[14px] font-[700] text-[#555] block mb-[6px]";
  const reqLabelClass = cn(labelClass, "text-[var(--cat-color)]");
  const reqInputClass = cn(inputClass, "border-[var(--cat-color)]");
  const fieldClass = "mb-[15px]";

  const { icon: catIcon, colorVar: catColorVar, lightBg: catLightBg } = getCategoryDetails(category);
  const catLabel = t.category_labels[category];

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(160,160,160,0.38)] flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-[15px] border-b border-[#eee] flex justify-between items-center bg-[#f9f9f9]">
          <div className="text-[18px] font-[700] text-[#333]">{t.create_modal.title}</div>
          <div className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]" onClick={onClose}>&times;</div>
        </div>

        {/* Category Banner */}
        <div
          className="flex items-center gap-[16px] px-[20px] py-[14px] border-b-[3px]"
          style={{ borderBottomColor: catColorVar, backgroundColor: catLightBg }}
        >
          <img src={catIcon} alt={catLabel} className="w-[44px] h-[44px] object-contain" />
          <span className="text-[20px] font-[800] uppercase tracking-wider" style={{ color: catColorVar }}>
            {catLabel}
          </span>
        </div>

        <div className="p-[20px] overflow-y-auto flex-grow" style={{ '--cat-color': catColorVar, '--cat-light-bg': catLightBg } as React.CSSProperties}>
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
                  {t.category_labels[catKey as ListingCategory]}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className={fieldClass}>
            <label className={reqLabelClass}>{t.create_modal.title_label} *</label>
            <input
              type="text"
              className={cn(reqInputClass, title.length >= 80 ? "border-[var(--color-red-search)]" : "")}
              placeholder={t.create_modal.title_placeholders[category] ?? t.create_modal.title_placeholder}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="float-right text-[13px] text-[#888] mt-[4px]">
              {t.create_modal.title_counter.replace('{count}', String(title.length))}
            </div>
          </div>

          {/* Description */}
          <div className={fieldClass}>
            <label className={reqLabelClass}>{t.create_modal.description_label} *</label>
            <textarea
              className={cn(reqInputClass, "h-[80px] resize-none")}
              placeholder={t.create_modal.description_placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Category-specific fields ── */}

          {category === "OFFER_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>
                {t.create_modal.offer_service.timefactor_label}{" "}
                <span className="text-[#999] font-normal">(0.25 – 3.0)</span>
              </label>
              <div className="flex items-center gap-[12px]">
                <input
                  type="range" min="0.25" max="3.0" step="0.25" value={timeFactor}
                  onChange={(e) => setTimeFactor(parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer accent-[#e05555]"
                />
                <div className="flex items-center gap-[8px] shrink-0">
                  <div className="bg-white border border-[#ddd] rounded-[6px] px-[14px] py-[8px] text-[16px] font-[700] text-[#333] min-w-[74px] text-center">
                    {String(timeFactor).replace(".", ",")} x
                  </div>
                  <img src="/Icons/timefactor.png" className="w-[44px] h-[44px] opacity-60" alt="" />
                </div>
              </div>
              <div className="text-[12px] text-[#888] mt-[8px] italic text-center">
                {t.create_modal.offer_service.timefactor_description.replace("{factor}", String(timeFactor).replace(".", ","))}
              </div>
            </div>
          )}

          {category === "SEARCH_SERVICE" && (
            <div className={fieldClass}>
              <label className={labelClass}>{t.create_modal.search_service.deadline_label}</label>
              <input type="date" value={searchServiceDeadline} onChange={(e) => setSearchServiceDeadline(e.target.value)} className={inputClass} />
            </div>
          )}

          {category === "SELL_PRODUCT" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.sell_product.condition_label} *</label>
                  <select className={reqInputClass} value={productCondition} onChange={(e) => setProductCondition(e.target.value as "NEW" | "USED")}>
                    <option value="NEW">{t.create_modal.sell_product.condition_new}</option>
                    <option value="USED">{t.create_modal.sell_product.condition_used}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.sell_product.stock_label} *</label>
                  <input type="number" min="1" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder={t.create_modal.sell_product.stock_placeholder} className={reqInputClass} />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.sell_product.price_time_label} *</label>
                  <div className="flex items-center gap-2">
                    <img src="/time.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="time" value={productTime} onChange={setProductTime} placeholder={t.create_modal.sell_product.price_time_placeholder} className={cn(reqInputClass, "flex-1")} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.sell_product.price_garas_label}</label>
                  <div className="flex items-center gap-2">
                    <img src="/garas.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="garas" value={productGaras} onChange={setProductGaras} placeholder={t.create_modal.sell_product.price_garas_placeholder} className={cn(inputClass, "flex-1")} />
                  </div>
                </div>
              </div>
            </>
          )}

          {category === "SEARCH_PRODUCT" && (
            <div className={fieldClass}>
              <label className={labelClass}>{t.create_modal.search_product.deadline_label}</label>
              <input type="date" value={searchProductDeadline} onChange={(e) => setSearchProductDeadline(e.target.value)} className={inputClass} />
            </div>
          )}

          {category === "OFFER_RENTAL" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.offer_rental.handling_fee_label} *</label>
                  <div className="flex items-center gap-2">
                    <img src="/time.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="time" value={rentalFeeTime} onChange={setRentalFeeTime} placeholder={t.create_modal.offer_rental.handling_fee_placeholder} className={cn(reqInputClass, "flex-1")} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.offer_rental.usage_fee_label} *</label>
                  <div className="flex items-center gap-2">
                    <img src="/garas.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="garas" value={rentalFeeGaras} onChange={setRentalFeeGaras} placeholder={t.create_modal.offer_rental.usage_fee_placeholder} className={cn(reqInputClass, "flex-1")} />
                  </div>
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.offer_rental.max_duration_label}</label>
                  <input type="text" value={rentalMaxDuration} onChange={(e) => setRentalMaxDuration(e.target.value)} placeholder={t.create_modal.offer_rental.max_duration_placeholder} className={inputClass} />
                </div>
                <div className="flex-1 flex items-center gap-2 pt-5">
                  <input type="checkbox" id="deposit" checked={rentalDeposit} onChange={(e) => setRentalDeposit(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="deposit" className={cn(labelClass, "mb-0 cursor-pointer")}>{t.create_modal.offer_rental.deposit_label}</label>
                </div>
              </div>
            </>
          )}

          {category === "RIDE_SHARE" && (
            <>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.ride_share.from_label} *</label>
                  <input type="text" value={rideStart} onChange={(e) => setRideStart(e.target.value)} placeholder={t.create_modal.ride_share.from_placeholder} className={reqInputClass} />
                </div>
                <div className="flex-1">
                  <label className={reqLabelClass}>{t.create_modal.ride_share.to_label} *</label>
                  <input type="text" value={rideDestination} onChange={(e) => setRideDestination(e.target.value)} placeholder={t.create_modal.ride_share.to_placeholder} className={reqInputClass} />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.departure_label}</label>
                  <input type="datetime-local" value={rideDeparture} onChange={(e) => setRideDeparture(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.seats_label}</label>
                  <input type="number" min="1" value={rideSeats} onChange={(e) => setRideSeats(e.target.value)} placeholder={t.create_modal.ride_share.seats_placeholder} className={inputClass} />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.price_time_label}</label>
                  <div className="flex items-center gap-2">
                    <img src="/time.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="time" value={ridePriceTime} onChange={setRidePriceTime} placeholder={t.create_modal.ride_share.price_time_placeholder} className={cn(inputClass, "flex-1")} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.ride_share.price_garas_label}</label>
                  <div className="flex items-center gap-2">
                    <img src="/garas.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="garas" value={ridePriceGaras} onChange={setRidePriceGaras} placeholder={t.create_modal.ride_share.price_garas_placeholder} className={cn(inputClass, "flex-1")} />
                  </div>
                </div>
              </div>
            </>
          )}

          {category === "EVENT_WORKSHOP" && (
            <>
              <div className={fieldClass}>
                <label className={reqLabelClass}>{t.create_modal.event_workshop.start_label} *</label>
                <input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} className={reqInputClass} />
              </div>
              <div className={fieldClass}>
                <label className={reqLabelClass}>{t.create_modal.event_workshop.end_label} *</label>
                <input type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} className={reqInputClass} />
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.location_label}</label>
                  <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder={t.create_modal.event_workshop.location_placeholder} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.max_participants_label}</label>
                  <input type="number" min="1" value={eventMaxParticipants} onChange={(e) => setEventMaxParticipants(e.target.value)} placeholder={t.create_modal.event_workshop.max_participants_placeholder} className={inputClass} />
                </div>
              </div>
              <div className={cn(fieldClass, "flex gap-4")}>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.entry_fee_label}</label>
                  <div className="flex items-center gap-2">
                    <img src="/time.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="time" value={eventPriceTime} onChange={setEventPriceTime} placeholder={t.create_modal.event_workshop.entry_fee_placeholder} className={cn(inputClass, "flex-1")} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{t.create_modal.event_workshop.material_fee_label}</label>
                  <div className="flex items-center gap-2">
                    <img src="/garas.png" className="w-[44px] h-[44px] flex-shrink-0" alt="" />
                    <FormattedNumberInput format="garas" value={eventPriceGaras} onChange={setEventPriceGaras} placeholder={t.create_modal.event_workshop.material_fee_placeholder} className={cn(inputClass, "flex-1")} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Payment / Price Notes */}
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
            <label className={isSearchCategory || isSellProduct ? reqLabelClass : labelClass}>
              {t.create_modal.tags_label}{(isSearchCategory || isSellProduct) && " *"}
            </label>
            <div ref={tagContainerRef}>
              <div className={cn(
                "border border-[var(--cat-color)] rounded-[4px] bg-[var(--input-bg)] p-[5px] flex flex-wrap gap-[5px]",
              )}>
                {tags.map((tag, i) => (
                  <div key={i} className="rounded-[12px] p-[4px_12px] text-[14px] flex items-center gap-[5px] border" style={{ backgroundColor: catLightBg, borderColor: catColorVar, color: catColorVar }}>
                    {tagDisplayLabels[tag] ?? tag}
                    <span className="cursor-pointer font-bold opacity-60" onClick={() => removeTag(i)}>&times;</span>
                  </div>
                ))}
                <input
                  type="text"
                  className="border-none outline-none bg-transparent text-[16px] flex-grow p-[5px]"
                  placeholder={t.create_modal.tags_placeholder}
                  value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); setShowTagDropdown(e.target.value.length > 0); }}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => tagInput.length > 0 && setShowTagDropdown(true)}
                />
              </div>
              {showTagDropdown && tagSuggestionsList.length > 0 && (
                <div className="bg-white border border-[#ccc] border-t-0 rounded-b-[4px] shadow-md max-h-[160px] overflow-y-auto">
                  {tagSuggestionsList.map((s) => (
                    <div
                      key={s.id}
                      className="px-[12px] py-[8px] text-[14px] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-[6px]"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectTagSuggestion(s); }}
                    >
                      <span>{s.label}</span>
                      {s.is_official && <span className="text-[11px] text-[#999]">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Location & Visibility (ZIP-based, replaces old map) ── */}
          <div className={cn(fieldClass, "flex gap-[10px]")}>
            <div className="flex-1">
              <label className={isSearchCategory || isSellProduct ? reqLabelClass : labelClass}>
                {t.create_modal.zip_code_label}{(isSearchCategory || isSellProduct) && " *"}
              </label>
              <input
                type="text"
                className={isSearchCategory || isSellProduct ? reqInputClass : inputClass}
                placeholder={t.create_modal.zip_placeholder}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
              />
            </div>
            <div className="flex-1">
              <label className={isSearchCategory || isSellProduct ? reqLabelClass : labelClass}>
                {t.create_modal.d_class_label}{(isSearchCategory || isSellProduct) && " *"}
              </label>
              <select
                className={cn(isSearchCategory || isSellProduct ? reqInputClass : inputClass, "h-[50px]")}
                value={dClass}
                onChange={(e) => setDClass(e.target.value as DClass)}
              >
                {(["D1", "D2", "D3", "D4", "D5", "D6"] as DClass[]).map((d) => (
                  <option key={d} value={d}>
                    {t.d_class_labels[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Until */}
          <div className={fieldClass}>
            <label className={labelClass}>
              {t.create_modal.available_until_label}
            </label>
            <div className="relative">
              <input
                ref={availableUntilRef}
                type="date"
                className={cn(inputClass, "pr-[40px] cursor-pointer")}
                value={availableUntil}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                max={getMaxAvailableUntil()}
                onChange={(e) => setAvailableUntil(e.target.value)}
                onClick={() => availableUntilRef.current?.showPicker()}
              />
              <button
                type="button"
                onClick={() => availableUntilRef.current?.showPicker()}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#888] hover:text-[var(--color-green-offer)] transition-colors"
              >
                <FaCalendarDays size={16} />
              </button>
            </div>
            <div className="text-[12px] text-[#888] mt-[4px]">{t.create_modal.available_until_hint}</div>
          </div>

          {/* Photos — hidden for search categories (no product to show) */}
          {category !== "SEARCH_PRODUCT" && category !== "SEARCH_SERVICE" && <div className={fieldClass}>
            <label className={labelClass}>{t.create_modal.images_label}</label>
            <p className="text-[13px] text-[#888] mb-[8px]">{t.create_modal.images_hint}</p>

            {previewUrls.length > 0 && (
              <div className="flex gap-[8px] flex-wrap mb-[10px]">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative w-[80px] h-[80px]">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-[4px] border border-[#ddd]" />
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
              <label className="inline-flex items-center gap-[6px] cursor-pointer bg-[#f0f0f0] border border-[#ccc] rounded-[4px] px-[12px] py-[10px] text-[15px] text-[#555] hover:bg-[#e8e8e8] transition-colors">
                <FaImage className="text-[14px]" />
                {t.create_modal.images_add}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </div>}

          {createMutation.isError && (
            <p className="text-[12px] text-red-500 mt-1">{t.create_modal.error_failed}</p>
          )}
        </div>

        {/* Footer */}
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
              className="flex-1 p-[12px] border-none rounded-[4px] font-bold cursor-pointer text-white flex justify-center items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: catColorVar }}
              onClick={handleSubmit}
              disabled={createMutation.isPending || isUploading || isConfirming || !isValid()}
            >
              {(createMutation.isPending || isUploading) && <FaSpinner className="animate-spin" />}
              {isUploading ? t.create_modal.images_uploading : createMutation.isPending ? t.create_modal.submit_loading : t.create_modal.submit_button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
