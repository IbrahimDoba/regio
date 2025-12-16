"use client";

import React from "react";
import FeedCard from "./FeedCard";
import { ListingPublic, ListingCategory } from "@/lib/api/types";

interface FeedListProps {
  listings: ListingPublic[];
  activeFilters: ListingCategory[];
  searchQuery: string;
  onOpenPreview: (listing: ListingPublic) => void;
}

export default function FeedList({
  listings,
  activeFilters,
  searchQuery,
  onOpenPreview,
}: FeedListProps) {
  const filteredListings = listings.filter((listing) => {
    if (!activeFilters.includes(listing.category)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = listing.title.toLowerCase();
      const desc = listing.description.toLowerCase();
      return title.includes(query) || desc.includes(query);
    }
    return true;
  });

  return (
    <div className="p-[10px] bg-[var(--bg-app)] min-h-[calc(100vh-140px)]">
      {filteredListings.map((listing) => (
        <FeedCard
          key={listing.id}
          listing={listing}
          onOpenPreview={onOpenPreview}
        />
      ))}
    </div>
  );
}
