"use client";

import React from "react";
import { FaEnvelope, FaPencil } from "react-icons/fa6";
import { ListingPublic } from "@/lib/api/types";
import { getCategoryDetails, ListingAttributes } from "@/lib/feed-helpers";

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { API_CONFIG } from "@/lib/api/config";
import type { Translations } from "@/context/LanguageContext";
import LocationAddress from "@/components/map/LocationAddress";
import { getEditLog } from "@/lib/listingEditLog";

interface PreviewModalProps {
  listing: ListingPublic | null;
  onClose: () => void;
  onContact?: (listing: ListingPublic) => void;
  onModify?: (listing: ListingPublic) => void;
  isContacting?: boolean;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-[8px] border-b border-[#f0f0f0] text-[13px]">
      <span className="text-[#888] font-[600] shrink-0 mr-4">{label}</span>
      <span className="text-[#333] font-[500] text-right">{value}</span>
    </div>
  );
}


function AttributeDetails({
  listing,
  a,
  timeUnit,
}: {
  listing: ListingPublic;
  a: Translations["preview_modal"]["attributes"];
  timeUnit: string;
}) {
  const attrs = listing.attributes as ListingAttributes;
  if (!attrs) return null;

  const rows: React.ReactNode[] = [];

  switch (listing.category) {
    case "OFFER_SERVICE":
      // time_factor shown in footer — no attribute rows needed
      break;

    case "SELL_PRODUCT":
      // prices shown in footer
      if (attrs.condition)
        rows.push(<Row key="cond" label={a.condition} value={attrs.condition} />);
      if (attrs.stock)
        rows.push(<Row key="stock" label={a.stock} value={attrs.stock} />);
      break;

    case "OFFER_RENTAL":
      // prices shown in footer
      if (attrs.max_rental_duration)
        rows.push(<Row key="md" label={a.max_duration} value={attrs.max_rental_duration} />);
      if (attrs.deposit_required != null)
        rows.push(
          <Row key="dep" label={a.deposit_required} value={attrs.deposit_required ? a.deposit_yes : a.deposit_no} />
        );
      break;

    case "RIDE_SHARE":
      if (attrs.from_location)
        rows.push(<Row key="from" label={a.from} value={attrs.from_location} />);
      if (attrs.to_location)
        rows.push(<Row key="to" label={a.to} value={attrs.to_location} />);
      if (attrs.departure_datetime)
        rows.push(
          <Row key="dep" label={a.departure} value={new Date(attrs.departure_datetime).toLocaleString()} />
        );
      if (attrs.seats_available)
        rows.push(<Row key="seats" label={a.seats_available} value={attrs.seats_available} />);
      // prices shown in footer
      break;

    case "EVENT_WORKSHOP":
      if (attrs.event_start_date)
        rows.push(
          <Row key="es" label={a.starts} value={new Date(attrs.event_start_date).toLocaleString()} />
        );
      if (attrs.event_end_date)
        rows.push(
          <Row key="ee" label={a.ends} value={new Date(attrs.event_end_date).toLocaleString()} />
        );
      if (attrs.location)
        rows.push(<Row key="loc" label={a.location} value={attrs.location} />);
      if (attrs.max_participants)
        rows.push(<Row key="mp" label={a.max_participants} value={attrs.max_participants} />);
      // prices shown in footer
      break;

    case "SEARCH_SERVICE":
      if (attrs.deadline)
        rows.push(
          <Row key="dl" label={a.deadline} value={new Date(attrs.deadline).toLocaleDateString()} />
        );
      break;

    case "SEARCH_PRODUCT":
      if (attrs.urgency_deadline)
        rows.push(
          <Row key="dl" label={a.needed_by} value={new Date(attrs.urgency_deadline).toLocaleDateString()} />
        );
      break;
  }

  if (attrs.price_notes)
    rows.push(<Row key="pn" label={a.price_notes} value={attrs.price_notes} />);

  if (rows.length === 0) return null;

  return (
    <div className="mb-[20px] bg-[#fafafa] rounded-[6px] p-[10px] border border-[#eee]">
      {rows}
    </div>
  );
}

export default function PreviewModal({
  listing,
  onClose,
  onContact,
  onModify,
  isContacting,
}: PreviewModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  if (!listing) return null;

  const isOwn = !!user && listing.owner_code === user.user_code;
  const timeUnit = language === "HU" ? "perc" : "min";

  const { icon, colorVar, lightBg } = getCategoryDetails(listing.category);
  const attrs = listing.attributes as ListingAttributes;

  const editLog = isOwn ? getEditLog(listing.id) : [];

  // Build footer pricing label + icon node
  let pricingLabel: string | null = null;
  let pricingNode: React.ReactNode = null;

  if (listing.category === "OFFER_SERVICE" && attrs?.time_factor) {
    pricingLabel = t.preview_modal.timefactor_label;
    pricingNode = (
      <div className="flex items-center gap-[8px]">
        <img src="/Icons/timefactor.png" className="w-[40px] h-[40px] object-contain" alt="" />
        <span className="text-[22px] font-[800]" style={{ color: colorVar }}>
          {String(attrs.time_factor).replace(".", ",")} x
        </span>
      </div>
    );
  } else {
    const timeVal = attrs?.time_amount ?? attrs?.handling_fee_time ?? attrs?.price_time ?? null;
    const garasVal = attrs?.regio_amount ?? attrs?.usage_fee_regio ?? attrs?.price_regio ?? null;
    const parts: React.ReactNode[] = [];
    if (timeVal) parts.push(
      <span key="t" className="flex items-center gap-[5px]">
        <img src="/time.png" className="w-[32px] h-[32px] object-contain" alt="" />
        <span className="text-[20px] font-[800]" style={{ color: colorVar }}>{timeVal} {timeUnit}</span>
      </span>
    );
    if (garasVal) parts.push(
      <span key="g" className="flex items-center gap-[5px]">
        <img src="/garas.png" className="w-[32px] h-[32px] object-contain" alt="" />
        <span className="text-[20px] font-[800]" style={{ color: colorVar }}>{Number(garasVal).toFixed(2).replace(".", ",")} G</span>
      </span>
    );
    if (parts.length > 0) {
      pricingLabel = t.preview_modal.value_label;
      pricingNode = <div className="flex items-center gap-[12px]">{parts}</div>;
    }
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="w-[95%] max-w-[460px] h-[90vh] bg-white rounded-[8px] p-0 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">

        {/* Category Banner — same style as CreateModal */}
        <div
          className="flex items-center gap-[16px] px-[20px] py-[14px] border-b-[3px] shrink-0"
          style={{ borderBottomColor: colorVar, backgroundColor: lightBg }}
        >
          <img src={icon} alt="" className="w-[44px] h-[44px] object-contain" />
          <span
            className="text-[18px] font-[800] uppercase tracking-wider flex-1 leading-tight"
            style={{ color: colorVar }}
          >
            {t.category_labels[listing.category]}
          </span>
          <div
            className="text-[28px] text-[#999] cursor-pointer leading-none hover:text-[#333]"
            onClick={onClose}
          >
            &times;
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-[20px] overflow-y-auto flex-grow">

          {/* User info row */}
          <div className="flex justify-between items-start mb-[10px]">
            <div className="flex gap-[12px] items-center">
              {listing.owner_avatar ? (
                <img
                  src={`${API_CONFIG.BASE_URL}/users/${listing.owner_code}/avatar`}
                  className="w-[44px] h-[44px] rounded-full object-cover border-[2px] border-[#e0e0e0] shrink-0"
                  alt=""
                />
              ) : (
                <div className="w-[44px] h-[44px] rounded-full bg-[#eee] flex items-center justify-center text-[#999] font-[700] text-[15px] shrink-0">
                  {listing.owner_name.substring(0, 2)}
                </div>
              )}
              <div>
                <div className="font-[700] text-[#222] text-[15px] leading-tight">{listing.owner_name}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className="font-[700] text-[13px] text-[#444]">
                {new Date(listing.created_at).toLocaleDateString()}
              </div>
              <div className="text-[10px] text-[#aaa] font-mono mt-[3px]">
                ID #{listing.id.substring(0, 8)}
              </div>
            </div>
          </div>

          {/* Region bar */}
          {listing.radius_km != null && (
            <div
              className="w-full text-center text-[13px] font-[700] py-[7px] mb-[14px] rounded-[4px]"
              style={{ backgroundColor: lightBg, color: colorVar }}
            >
              {t.feed_card.region_label} {listing.radius_km}{t.feed_card.region_unit}
            </div>
          )}

          {/* Title */}
          <div
            className="text-[22px] font-[800] mb-[10px] leading-snug"
            style={{ color: colorVar }}
          >
            {listing.title}
          </div>

          {/* Description */}
          <div className="text-[15px] leading-[1.6] text-[#333] mb-[16px] whitespace-pre-wrap">
            {listing.description}
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-[5px] mb-[16px]">
              {listing.tags.map((tag, i) => (
                <div
                  key={i}
                  className="bg-[#eee] p-[4px_10px] rounded-[12px] text-[11px] text-[#555] font-[600]"
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Address + togglable map */}
          {listing.location_lat != null && listing.location_lng != null && (
            <LocationAddress
              lat={listing.location_lat}
              lng={listing.location_lng}
              showMapLabel={t.preview_modal.show_map}
              hideMapLabel={t.preview_modal.hide_map}
            />
          )}

          {/* Category-specific attributes */}
          <AttributeDetails
            listing={listing}
            a={t.preview_modal.attributes}
            timeUnit={timeUnit}
          />

          {/* Image Gallery — shown after attributes */}
          {listing.media_urls.length > 0 && (
            <div className="mb-[20px]">
              <div className="text-[12px] font-[700] text-[#888] uppercase tracking-[0.5px] mb-[8px]">
                {t.preview_modal.images_label}
              </div>
              <div className="flex gap-[8px] overflow-x-auto pb-[4px]">
                {listing.media_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-[120px] w-auto rounded-[6px] object-cover border border-[#eee] hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Edit log (own posts only) */}
          {isOwn && editLog.length > 0 && (
            <div className="mt-[10px] mb-[20px]">
              <div className="text-[12px] font-[700] text-[#888] mb-[6px] uppercase tracking-wide">
                {t.preview_modal.edit_log_title}
              </div>
              <div className="bg-[#f8f8f8] rounded-[6px] border border-[#eee] p-[10px] text-[11px] font-mono text-[#555] space-y-[4px] max-h-[140px] overflow-y-auto">
                {editLog.map((entry, i) => (
                  <div key={i}>
                    <span className="text-[#aaa]">{new Date(entry.ts).toLocaleString()}</span>{" "}
                    <span className="text-[#555] font-bold">{entry.field}:</span>{" "}
                    <span className="text-[#c00]">{String(entry.from)}</span>
                    {" → "}
                    <span className="text-[#080]">{String(entry.to)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-[15px] border-t border-[#eee] bg-white shrink-0">

          {/* Zeitfaktor / Wert pricing row */}
          {pricingLabel && (
            <div
              className="flex items-center justify-between mb-[10px] px-[16px] py-[12px] rounded-[8px] border"
              style={{
                borderColor: colorVar,
                backgroundColor: lightBg,
              }}
            >
              <span className="text-[15px] font-[700] text-[#444]">{pricingLabel}</span>
              {pricingNode}
            </div>
          )}

          {/* Action button */}
          {isOwn ? (
            <button
              onClick={() => onModify?.(listing)}
              className="w-full p-[12px] text-[16px] rounded-[5px] border-none text-white font-bold cursor-pointer flex justify-center items-center gap-[10px] hover:brightness-110 transition-all"
              style={{ backgroundColor: colorVar }}
            >
              <FaPencil /> {t.preview_modal.modify_button}
            </button>
          ) : (
            <button
              onClick={() => onContact?.(listing)}
              disabled={isContacting}
              className="w-full p-[12px] text-[16px] rounded-[5px] border-none text-white font-bold cursor-pointer flex justify-center items-center gap-[10px] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: colorVar }}
            >
              {isContacting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.preview_modal.contact_loading}
                </>
              ) : (
                <>
                  <FaEnvelope /> {t.preview_modal.contact_button}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
