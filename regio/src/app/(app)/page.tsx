"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaGlobe } from "react-icons/fa6";
import Header from "@/components/layout/Header";
import FilterPanel from "@/components/feed/FilterPanel";
import FeedList from "@/components/feed/FeedList";
import PreviewModal from "@/components/modals/PreviewModal";
import CreateModal from "@/components/modals/CreateModal";
import EditModal from "@/components/modals/EditModal";
import { ListingCategory, ListingPublic } from "@/lib/api/types";
import { useFeed, useCreateListingInquiry } from "@/lib/api";
import { getStoredHomebaseZip } from "@/lib/api/hooks/use-listings";
import { useRealTime } from "@/context/RealTimeContext";
import { CATEGORY_CONFIG } from "@/lib/feed-helpers";
import { ListingAttributes } from "@/lib/feed-helpers";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/context/DialogContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { API_CONFIG } from "@/lib/api/config";

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Category toggles
  const [activeFilters, setActiveFilters] = useState<ListingCategory[]>(
    Object.keys(CATEGORY_CONFIG) as ListingCategory[]
  );

  // Staged filter state (assembled in UI, not yet sent to API)
  const [stagedQ, setStagedQ] = useState("");
  const [stagedTags, setStagedTags] = useState<string[]>([]);
  const [stagedViewerZip, setStagedViewerZip] = useState<string>("");
  const [stagedMaxDistanceKm, setStagedMaxDistanceKm] = useState<number | undefined>(undefined);

  // Committed filters (sent to API on search)
  const [committedFilters, setCommittedFilters] = useState<{
    q?: string;
    tags?: string[];
    viewer_zip?: string | null;
    max_distance_km?: number | null;
  }>({});

  const [showOriginal, setShowOriginal] = useState(false);
  const [previewListing, setPreviewListing] = useState<ListingPublic | null>(null);
  const [editListing, setEditListing] = useState<ListingPublic | null>(null);

  const { t } = useLanguage();
  const dialog = useDialog();
  const toast = useToast();
  const { isConnected: isChatConnected, createListingRoom } = useRealTime();
  const { mutateAsync: createListingInquiry } = useCreateListingInquiry();
  const [isContacting, setIsContacting] = useState(false);

  // Restore homebase ZIP on mount and immediately apply it to the feed
  useEffect(() => {
    const stored = getStoredHomebaseZip();
    const zip = user?.zip_code || stored || "";
    if (zip) {
      setStagedViewerZip(zip);
      setCommittedFilters((prev) => ({ ...prev, viewer_zip: zip }));
    }
  }, [user?.zip_code]);

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
      const attrs = (listing.attributes ?? {}) as ListingAttributes;
      const priceTime = attrs.time_amount ?? attrs.handling_fee_time ?? attrs.price_time;
      const priceGaras = attrs.regio_amount ?? attrs.usage_fee_regio ?? attrs.price_regio;
      const prefill = t.feed.contact_prefill.replace("{title}", listing.title);
      const params = new URLSearchParams({
        room: roomId,
        name: listing.owner_name,
        avatar: listing.owner_avatar ? `${API_CONFIG.BASE_URL}/users/${listing.owner_code}/avatar` : "",
        listing: listing.title,
        prefill,
        ...(priceTime ? { price_time: String(priceTime) } : {}),
        ...(priceGaras ? { price_garas: String(priceGaras) } : {}),
      });
      router.push(`/chat?${params.toString()}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error(isChatConnected ? t.feed.error_chat_start : t.feed.error_chat_not_connected);
    } finally {
      setIsContacting(false);
    }
  };

  const handleSearch = () => {
    setCommittedFilters({
      ...(stagedQ ? { q: stagedQ } : {}),
      ...(stagedTags.length > 0 ? { tags: stagedTags } : {}),
      ...(stagedViewerZip ? { viewer_zip: stagedViewerZip } : {}),
      ...(stagedViewerZip && stagedMaxDistanceKm !== undefined
        ? { max_distance_km: stagedMaxDistanceKm }
        : {}),
    });
  };

  const addTag = (tag: string) => setStagedTags((prev) => [...prev, tag]);
  const removeTag = (tag: string) => setStagedTags((prev) => prev.filter((t) => t !== tag));

  const { data, isLoading } = useFeed(committedFilters, showOriginal);
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
        count={listings.length}
        total={listings.length}
        showOriginal={showOriginal}
        onToggleOriginal={() => setShowOriginal((v) => !v)}
      >
        <FilterPanel
          isOpen={isFilterOpen}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          q={stagedQ}
          setQ={setStagedQ}
          tags={stagedTags}
          addTag={addTag}
          removeTag={removeTag}
          viewerZip={stagedViewerZip}
          setViewerZip={setStagedViewerZip}
          maxDistanceKm={stagedMaxDistanceKm}
          setMaxDistanceKm={setStagedMaxDistanceKm}
          onSearch={handleSearch}
        />
      </Header>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500">{t.feed.loading}</div>
      ) : (
        <FeedList
          listings={listings}
          activeFilters={activeFilters}
          onOpenPreview={setPreviewListing}
          onContact={handleContact}
          onModify={(listing) => { setPreviewListing(null); setEditListing(listing); }}
        />
      )}

      <PreviewModal
        listing={previewListing}
        onClose={() => setPreviewListing(null)}
        isContacting={isContacting}
        onContact={handleContact}
        onModify={(listing) => { setPreviewListing(null); setEditListing(listing); }}
      />

      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editListing && (
        <EditModal
          key={editListing.id}
          listing={editListing}
          onClose={() => setEditListing(null)}
        />
      )}

      <button
        className="fixed bottom-[20px] right-[20px] w-[60px] h-[60px] rounded-full bg-[var(--color-green-offer)] text-white text-[24px] flex justify-center items-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-none cursor-pointer z-50 hover:brightness-110 transition-all active:scale-95"
        onClick={() => setIsCreateOpen(true)}
      >
        <FaPlus />
      </button>
    </>
  );
}
