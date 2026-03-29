"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa6";
import Header from "@/components/layout/Header";
import FilterPanel from "@/components/feed/FilterPanel";
import FeedList from "@/components/feed/FeedList";
import PreviewModal from "@/components/modals/PreviewModal";
import CreateModal from "@/components/modals/CreateModal";
import { ListingCategory, ListingPublic } from "@/lib/api/types";
import { useFeed, useCreateListingInquiry } from "@/lib/api";
import { useRealTime } from "@/context/RealTimeContext";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";

export default function FeedPage() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Initialize with all categories
  const [activeFilters, setActiveFilters] = useState<ListingCategory[]>(
    Object.keys(CATEGORY_CONFIG) as ListingCategory[]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [previewListing, setPreviewListing] = useState<ListingPublic | null>(
    null
  );

  const { isConnected: isChatConnected, createListingRoom } = useRealTime();
  const { mutateAsync: createListingInquiry } = useCreateListingInquiry();
  const [isContacting, setIsContacting] = useState(false);

  // Handle contact action - used by both FeedCard and PreviewModal
  const handleContact = async (listing: ListingPublic) => {
    if (isContacting) return;
    setIsContacting(true);
    try {
      let roomId: string;
      try {
        const result = await createListingInquiry({
          listing_id: listing.id,
          listing_title: listing.title,
          seller_user_code: listing.owner_code,
        });
        roomId = result.matrix_room_id;
      } catch (backendErr) {
        console.warn("Backend inquiry failed, trying context fallback:", backendErr);
        roomId = await createListingRoom(listing.id, listing.title, listing.owner_code);
      }
      setPreviewListing(null);
      const params = new URLSearchParams({
        room: roomId,
        name: listing.owner_name,
        avatar: listing.owner_avatar || "",
        listing: listing.title,
      });
      router.push(`/chat?${params.toString()}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(
        isChatConnected
          ? "Failed to start chat. Please try again."
          : "Chat is not connected yet. Please wait a moment and try again."
      );
    } finally {
      setIsContacting(false);
    }
  };

  // Fetch Feed
  const { data, isLoading } = useFeed({
    // We can filter by backend if we want, but UI filtering is implemented in FeedList for now
    // properly we should pass params to useFeed, but let's keep client-side filtering logic from previous impl if lists are small,
    // OR pass params to API.
    // The previous implementation did client side filtering.
    // Let's stick to client side filtering on the fetched page for simplicity OF TRANSITION,
    // but typically we should pass `categories: activeFilters` to API.
    // However, the task is to "replace mock data".
    // I will pass NO params to get everything, and let FeedList filter (as it does now).
    // Wait, FeedList expects `listings`.
  });

  const listings = data?.pages.flatMap((page) => page.data) || [];

  const toggleFilter = (category: ListingCategory) => {
    if (activeFilters.includes(category)) {
      setActiveFilters(activeFilters.filter((c) => c !== category));
    } else {
      setActiveFilters([...activeFilters, category]);
    }
  };

  return (
    <>
      <Header
        isFilterOpen={isFilterOpen}
        toggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        count={listings.length} // Should be filtered count ideally
        total={listings.length}
      >
        <FilterPanel
          isOpen={isFilterOpen}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Header>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading listings...</div>
      ) : (
        <FeedList
          listings={listings}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          onOpenPreview={setPreviewListing}
          onContact={handleContact}
        />
      )}

      <PreviewModal
        listing={previewListing}
        onClose={() => setPreviewListing(null)}
        isContacting={isContacting}
        onContact={handleContact}
      />

      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <button
        className="fixed bottom-[20px] right-[20px] w-[60px] h-[60px] rounded-full bg-[var(--color-green-offer)] text-white text-[24px] flex justify-center items-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-none cursor-pointer z-50 hover:brightness-110 transition-all active:scale-95"
        onClick={() => setIsCreateOpen(true)}
      >
        <FaPlus />
      </button>
    </>
  );
}
