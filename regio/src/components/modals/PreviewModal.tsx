"use client";

import React from "react";
import { FaEnvelope } from "react-icons/fa6";
import { ListingPublic } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getCategoryDetails, ListingAttributes } from "@/lib/feed-helpers";
import { formatPriceNode } from "@/lib/feed-helpers";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/context/LanguageContext";
import LocationMap from "@/components/map/LocationMap";

interface PreviewModalProps {
  listing: ListingPublic | null;
  onClose: () => void;
  onContact?: (listing: ListingPublic) => void;
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

function AttributeDetails({ listing, a }: { listing: ListingPublic; a: Translations["preview_modal"]["attributes"] }) {
  const attrs = listing.attributes as ListingAttributes;
  if (!attrs) return null;

  const TVal = ({ v }: { v: string }) => <span className="inline-flex items-center gap-1"><img src="/time.png" className="w-4 h-4" alt="" />{v}</span>;
  const GVal = ({ v }: { v: string }) => <span className="inline-flex items-center gap-1"><img src="/garas.png" className="w-4 h-4" alt="" />{v}</span>;
  const TFVal = ({ v }: { v: string }) => <span className="inline-flex items-center gap-1"><img src="/timefactor.png" className="w-4 h-4" alt="" />{v}</span>;

  const rows: React.ReactNode[] = [];

  switch (listing.category) {
    case "OFFER_SERVICE":
      rows.push(<Row key="tf" label={a.time_factor} value={<TFVal v={`${attrs.time_factor ?? 1.0}x — final cost = hours worked × ${attrs.time_factor ?? 1.0}`} />} />);
      break;

    case "SELL_PRODUCT":
      if (attrs.time_amount) rows.push(<Row key="ta" label={a.price_time} value={<TVal v={`${attrs.time_amount} min`} />} />);
      if (attrs.regio_amount) rows.push(<Row key="ra" label={a.price_garas} value={<GVal v={`${attrs.regio_amount} G`} />} />);
      if (attrs.condition) rows.push(<Row key="cond" label={a.condition} value={attrs.condition} />);
      if (attrs.stock) rows.push(<Row key="stock" label={a.stock} value={attrs.stock} />);
      break;

    case "OFFER_RENTAL":
      if (attrs.handling_fee_time) rows.push(<Row key="ft" label={a.handling_fee} value={<TVal v={`${attrs.handling_fee_time} min`} />} />);
      if (attrs.usage_fee_regio) rows.push(<Row key="fr" label={a.usage_fee} value={<GVal v={`${attrs.usage_fee_regio} G`} />} />);
      if (attrs.max_rental_duration) rows.push(<Row key="md" label={a.max_duration} value={attrs.max_rental_duration} />);
      if (attrs.deposit_required != null) rows.push(<Row key="dep" label={a.deposit_required} value={attrs.deposit_required ? a.deposit_yes : a.deposit_no} />);
      break;

    case "RIDE_SHARE":
      if (attrs.from_location) rows.push(<Row key="from" label={a.from} value={attrs.from_location} />);
      if (attrs.to_location) rows.push(<Row key="to" label={a.to} value={attrs.to_location} />);
      if (attrs.departure_datetime) rows.push(<Row key="dep" label={a.departure} value={new Date(attrs.departure_datetime).toLocaleString()} />);
      if (attrs.seats_available) rows.push(<Row key="seats" label={a.seats_available} value={attrs.seats_available} />);
      if (attrs.price_time) rows.push(<Row key="pt" label={a.price_per_seat_time} value={<TVal v={`${attrs.price_time} min`} />} />);
      if (attrs.price_regio) rows.push(<Row key="pg" label={a.price_per_seat_garas} value={<GVal v={`${attrs.price_regio} G`} />} />);
      break;

    case "EVENT_WORKSHOP":
      if (attrs.event_start_date) rows.push(<Row key="es" label={a.starts} value={new Date(attrs.event_start_date).toLocaleString()} />);
      if (attrs.event_end_date) rows.push(<Row key="ee" label={a.ends} value={new Date(attrs.event_end_date).toLocaleString()} />);
      if (attrs.location) rows.push(<Row key="loc" label={a.location} value={attrs.location} />);
      if (attrs.max_participants) rows.push(<Row key="mp" label={a.max_participants} value={attrs.max_participants} />);
      if (attrs.price_time) rows.push(<Row key="pt" label={a.entry_fee_time} value={<TVal v={`${attrs.price_time} min`} />} />);
      if (attrs.price_regio) rows.push(<Row key="pg" label={a.material_fee_garas} value={<GVal v={`${attrs.price_regio} G`} />} />);
      break;

    case "SEARCH_SERVICE":
      if (attrs.deadline) rows.push(<Row key="dl" label={a.deadline} value={new Date(attrs.deadline).toLocaleDateString()} />);
      break;

    case "SEARCH_PRODUCT":
      if (attrs.urgency_deadline) rows.push(<Row key="dl" label={a.needed_by} value={new Date(attrs.urgency_deadline).toLocaleDateString()} />);
      break;
  }

  if (attrs.price_notes) rows.push(<Row key="pn" label={a.price_notes} value={attrs.price_notes} />);

  if (rows.length === 0) return null;

  return (
    <div className="mb-[20px] bg-[#fafafa] rounded-[6px] p-[10px] border border-[#eee]">
      {rows}
    </div>
  );
}

export default function PreviewModal({ listing, onClose, onContact, isContacting }: PreviewModalProps) {
  const { t } = useLanguage();
  if (!listing) return null;

  const { color, icon, label, colorVar } = getCategoryDetails(listing.category);
  const priceDisplay = formatPriceNode(listing);

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
                <div>{t.feed_card.region_label} {listing.radius_km}{t.feed_card.region_unit}</div>
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

          {/* Image Gallery */}
          {listing.media_urls.length > 0 && (
            <div className="flex gap-[8px] overflow-x-auto pb-[4px] mb-[20px]">
              {listing.media_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-[160px] w-auto rounded-[6px] object-cover border border-[#eee] hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Location map */}
          {listing.location_lat != null && listing.location_lng != null && (
            <div className="mb-[20px]">
              <LocationMap lat={listing.location_lat} lng={listing.location_lng} />
            </div>
          )}

          {/* Category-specific attributes */}
          <AttributeDetails listing={listing} a={t.preview_modal.attributes} />
        </div>

        {/* Footer */}
        <div className="p-[15px] border-t border-[#eee] bg-white">
          {priceDisplay && (
            <div className="bg-[#f0f7e6] p-[15px] rounded-[6px] flex justify-between items-center mb-[10px] border border-[#dcebc0]">
              <span className="text-[12px] text-[#666] font-[600]">
                {t.preview_modal.price_label}
              </span>
              <span className="text-[18px] font-[800] text-[var(--color-green-offer)]">
                {priceDisplay}
              </span>
            </div>
          )}
          <button
            onClick={() => onContact?.(listing)}
            disabled={isContacting}
            className={`w-full p-[12px] text-[16px] rounded-[5px] border-none text-white font-bold cursor-pointer flex justify-center items-center gap-[10px] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
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
        </div>
      </div>
    </div>
  );
}
