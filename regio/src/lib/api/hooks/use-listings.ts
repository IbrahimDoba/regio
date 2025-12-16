import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import * as listingsApi from "../modules/listings";
import { queryKeys, invalidationGroups } from "../query-keys";
import {
  ListingCreate,
  ListingUpdate,
  FeedParams,
  FeedResponse,
  ListingPublic,
} from "../types";

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch the listings feed (Infinite Scroll)
 */
export function useFeed(params?: FeedParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.feed(params),
    queryFn: ({ pageParam = 0 }) =>
      listingsApi.getFeed({ ...params, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: FeedResponse) =>
      lastPage.next_cursor ?? undefined,
  });
}

/**
 * Hook to fetch a single listing by ID
 */
export function useListing(listingId: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(listingId),
    queryFn: () => listingsApi.getListing(listingId),
    enabled: !!listingId,
  });
}

/**
 * Hook to search tags
 */
export function useSearchTags(query: string) {
  return useQuery({
    queryKey: queryKeys.listings.tags.search(query),
    queryFn: () => listingsApi.searchTags(query),
    enabled: query.length > 1,
    staleTime: 5 * 60 * 1000, // Cache tags for 5 minutes
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to create a new listing
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ListingCreate) => listingsApi.createListing(data),
    onSuccess: () => {
      // Invalidate feed to show new listing
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all() });
    },
  });
}

/**
 * Hook to update existing listing
 */
export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listingId,
      data,
    }: {
      listingId: string;
      data: ListingUpdate;
    }) => listingsApi.updateListing(listingId, data),
    onSuccess: (updatedListing) => {
      // Update specific listing in cache
      queryClient.setQueryData(
        queryKeys.listings.detail(updatedListing.id),
        updatedListing
      );
      // Invalidate feeds to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.lists() });
    },
  });
}

/**
 * Hook to delete a listing
 */
export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => listingsApi.deleteListing(listingId),
    onSuccess: (_, listingId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.listings.detail(listingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all() });
    },
  });
}
