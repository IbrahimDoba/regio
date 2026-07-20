"use client";

import React from "react";
import FeedCard from "./FeedCard";
import FeedEmptyState from "./FeedEmptyState";
import { ListingPublic, ListingCategory } from "@/lib/api/types";

interface FeedListProps {
  listings: ListingPublic[];
  activeFilters: ListingCategory[];
  onOpenPreview: (listing: ListingPublic) => void;
  onContact?: (listing: ListingPublic) => void;
  onModify?: (listing: ListingPublic) => void;
  /** Sentinel observed for infinite scroll; loads the next page when visible. */
  sentinelRef?: React.Ref<HTMLDivElement>;
  /** True while the next page is being fetched. */
  isFetchingMore?: boolean;
  /** Label shown while loading more listings. */
  loadingLabel?: string;
  /** True when a search/tag/distance/category filter is active. */
  isFiltered?: boolean;
  /** Full reset to the overview, wired to the empty-state CTA. */
  onReset?: () => void;
}

export default function FeedList({
  listings,
  activeFilters,
  onOpenPreview,
  onContact,
  onModify,
  sentinelRef,
  isFetchingMore,
  loadingLabel,
  isFiltered,
  onReset,
}: FeedListProps) {
  const filteredListings = listings.filter((listing) =>
    activeFilters.includes(listing.category)
  );

  // pb clears the fixed 60px bottom nav so the last card isn't covered.
  return (
    <div className="p-[10px] pb-[80px] bg-[var(--bg-app)] min-h-[calc(100vh-140px)]">
      {filteredListings.length === 0 && isFiltered && !isFetchingMore ? (
        <FeedEmptyState onReset={onReset ?? (() => {})} />
      ) : (
        <>
          {filteredListings.map((listing) => (
            <FeedCard
              key={listing.id}
              listing={listing}
              onOpenPreview={onOpenPreview}
              onContact={onContact}
              onModify={onModify}
            />
          ))}
          <div ref={sentinelRef} />
          {isFetchingMore && (
            <div className="py-4 text-center text-gray-500">{loadingLabel}</div>
          )}
        </>
      )}
    </div>
  );
}
