"use client";

import React from "react";
import FeedCard from "./FeedCard";
import { ListingPublic, ListingCategory } from "@/lib/api/types";

interface FeedListProps {
  listings: ListingPublic[];
  activeFilters: ListingCategory[];
  onOpenPreview: (listing: ListingPublic) => void;
  onContact?: (listing: ListingPublic) => void;
  onModify?: (listing: ListingPublic) => void;
}

export default function FeedList({
  listings,
  activeFilters,
  onOpenPreview,
  onContact,
  onModify,
}: FeedListProps) {
  const filteredListings = listings.filter((listing) =>
    activeFilters.includes(listing.category)
  );

  return (
    <div className="p-[10px] bg-[var(--bg-app)] min-h-[calc(100vh-140px)]">
      {filteredListings.map((listing) => (
        <FeedCard
          key={listing.id}
          listing={listing}
          onOpenPreview={onOpenPreview}
          onContact={onContact}
          onModify={onModify}
        />
      ))}
    </div>
  );
}
