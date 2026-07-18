"use client";

import React, { useState } from "react";
import { FaCalendarDays, FaSpinner } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ListingPublic, ListingStatus } from "@/lib/api/types";
import { getCategoryDetails } from "@/lib/feed-helpers";
import { useUpdateListing, useDeleteListing } from "@/lib/api/hooks/use-listings";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/context/DialogContext";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/admin/ui/StatusBadge";

interface MyListingCardProps {
  listing: ListingPublic;
  onEdit: (listing: ListingPublic) => void;
}

/** Maps a listing status to a StatusBadge variant. */
const STATUS_VARIANT: Record<
  ListingStatus,
  "active" | "pending" | "sold" | "conflict"
> = {
  ACTIVE: "active",
  INACTIVE: "pending",
  SOLD: "sold",
  DELETED: "conflict",
};

/** Native date input bounds: tomorrow through +62 days (matches backend validator). */
function reactivateDateLimits() {
  const now = Date.now();
  return {
    min: new Date(now + 86400000).toISOString().slice(0, 10),
    max: new Date(now + 62 * 86400000).toISOString().slice(0, 10),
  };
}

export default function MyListingCard({ listing, onEdit }: MyListingCardProps) {
  const { t } = useLanguage();
  const dialog = useDialog();
  const toast = useToast();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const { icon, label, colorVar } = getCategoryDetails(listing.category);
  const tl = t.profile.listings_tab;

  // Inline date picker shown when reactivating/restoring an inactive listing.
  const [reactivating, setReactivating] = useState(false);
  const [reactivateDate, setReactivateDate] = useState("");
  const [dateLimits] = useState(reactivateDateLimits);

  const isBusy = updateListing.isPending || deleteListing.isPending;

  const statusLabel: Record<ListingStatus, string> = {
    ACTIVE: tl.status_active,
    INACTIVE: tl.status_inactive,
    SOLD: tl.status_sold,
    DELETED: tl.status_deleted,
  };

  const patchStatus = (
    data: Parameters<typeof updateListing.mutate>[0]["data"],
    successMsg: string,
  ) => {
    updateListing.mutate(
      { listingId: listing.id, data },
      {
        onSuccess: () => {
          toast.success(successMsg);
          setReactivating(false);
        },
        onError: () => toast.error(tl.toast_action_error),
      },
    );
  };

  const confirmReactivate = () => {
    if (!reactivateDate) return;
    // Midday UTC keeps the chosen day strictly in the future and within range.
    patchStatus(
      { status: "ACTIVE", available_until: `${reactivateDate}T12:00:00Z` },
      listing.status === "DELETED" ? tl.toast_restored : tl.toast_reactivated,
    );
  };

  const handleMarkSold = async () => {
    const ok = await dialog.confirm(
      tl.confirm_mark_sold_title,
      tl.confirm_mark_sold_body,
    );
    if (ok) patchStatus({ status: "SOLD" }, tl.toast_marked_sold);
  };

  const handleDeactivate = async () => {
    const ok = await dialog.confirm(
      tl.confirm_deactivate_title,
      tl.confirm_deactivate_body,
    );
    if (ok) patchStatus({ status: "INACTIVE" }, tl.toast_deactivated);
  };

  const handleDelete = async () => {
    const ok = await dialog.confirm(
      t.preview_modal.delete_confirm_title,
      t.preview_modal.delete_confirm_body,
    );
    if (!ok) return;
    deleteListing.mutate(listing.id, {
      onSuccess: () => toast.success(t.preview_modal.toast_deleted),
      onError: () => toast.error(t.preview_modal.toast_delete_error),
    });
  };

  const actionBtn =
    "px-[12px] py-[7px] rounded-[6px] text-[12px] font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      className="bg-white rounded-[8px] border border-[#eee] border-l-[4px] p-[12px_14px] mb-[10px]"
      style={{ borderLeftColor: colorVar }}
    >
      {/* Header: icon, title, status badge */}
      <div className="flex items-start gap-[10px]">
        {listing.media_urls[0] ? (
          <img
            src={listing.media_urls[0]}
            alt=""
            className="w-[44px] h-[44px] rounded-[6px] object-cover border border-[#eee] shrink-0"
          />
        ) : (
          <img src={icon} alt={label} className="w-[40px] h-[40px] object-contain shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-[8px]">
            <h4 className="text-[15px] font-[600] text-[#222] leading-[1.3] break-words">
              {listing.title}
            </h4>
            <StatusBadge
              variant={STATUS_VARIANT[listing.status]}
              label={statusLabel[listing.status]}
            />
          </div>
          <div className="text-[11px] text-[#888] mt-[4px] flex flex-wrap gap-x-[12px] gap-y-[2px]">
            <span>{tl.posted_on.replace("{date}", new Date(listing.created_at).toLocaleDateString())}</span>
            <span>
              {listing.available_until
                ? tl.expires_on.replace("{date}", new Date(listing.available_until).toLocaleDateString())
                : tl.no_expiry}
            </span>
          </div>
        </div>
      </div>

      {/* Inline reactivate/restore date picker */}
      {reactivating ? (
        <div className="mt-[12px] p-[12px] bg-[#f9f9f9] rounded-[6px] border border-[#eee]">
          <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
            {tl.reactivate_date_label}
          </label>
          <div className="relative mb-[10px]">
            <input
              type="date"
              className="w-full p-[10px] pr-[38px] border border-[#ddd] rounded-[6px] text-[14px] bg-white outline-none focus:border-[var(--color-green-offer)]"
              value={reactivateDate}
              min={dateLimits.min}
              max={dateLimits.max}
              onChange={(e) => setReactivateDate(e.target.value)}
            />
            <FaCalendarDays className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#888] pointer-events-none" size={15} />
          </div>
          <div className="flex gap-[8px]">
            <button
              className={cn(actionBtn, "flex-1 bg-[var(--color-green-offer)] text-white flex justify-center items-center gap-[6px]")}
              onClick={confirmReactivate}
              disabled={!reactivateDate || isBusy}
            >
              {updateListing.isPending ? <FaSpinner className="animate-spin" /> : null}
              {tl.reactivate_confirm}
            </button>
            <button
              className={cn(actionBtn, "bg-white border border-[#ccc] text-[#555]")}
              onClick={() => setReactivating(false)}
              disabled={isBusy}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-[8px] mt-[12px]">
          {listing.status === "ACTIVE" && (
            <>
              <button className={cn(actionBtn, "bg-white border border-[#ccc] text-[#555]")} onClick={() => onEdit(listing)} disabled={isBusy}>
                {tl.action_edit}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#1976d2] text-[#1976d2]")} onClick={handleMarkSold} disabled={isBusy}>
                {tl.action_mark_sold}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#ccc] text-[#555]")} onClick={handleDeactivate} disabled={isBusy}>
                {tl.action_deactivate}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#d32f2f] text-[#d32f2f]")} onClick={handleDelete} disabled={isBusy}>
                {tl.action_delete}
              </button>
            </>
          )}
          {listing.status === "INACTIVE" && (
            <>
              <button className={cn(actionBtn, "bg-[var(--color-green-offer)] text-white")} onClick={() => setReactivating(true)} disabled={isBusy}>
                {tl.action_reactivate}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#ccc] text-[#555]")} onClick={() => onEdit(listing)} disabled={isBusy}>
                {tl.action_edit}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#d32f2f] text-[#d32f2f]")} onClick={handleDelete} disabled={isBusy}>
                {tl.action_delete}
              </button>
            </>
          )}
          {listing.status === "SOLD" && (
            <>
              <button className={cn(actionBtn, "bg-[var(--color-green-offer)] text-white")} onClick={() => setReactivating(true)} disabled={isBusy}>
                {tl.action_reactivate}
              </button>
              <button className={cn(actionBtn, "bg-white border border-[#d32f2f] text-[#d32f2f]")} onClick={handleDelete} disabled={isBusy}>
                {tl.action_delete}
              </button>
            </>
          )}
          {listing.status === "DELETED" && (
            <button className={cn(actionBtn, "bg-[var(--color-green-offer)] text-white")} onClick={() => setReactivating(true)} disabled={isBusy}>
              {tl.action_restore}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
