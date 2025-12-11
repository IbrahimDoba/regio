/**
 * Listings Hooks
 *
 * Custom React hooks for listings and feed operations using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '../modules/listings';
import { queryKeys } from '../query-keys';
import type {
  FeedParams,
  ListingCreate,
  ListingUpdate,
} from '../types';

// ============================================================================
// Feed Queries
// ============================================================================

/**
 * Get feed with filters
 * Supports filtering by categories, tags, text search, and cursor-based pagination
 */
export function useFeed(params?: FeedParams) {
  return useQuery({
    queryKey: queryKeys.listings.feed(params),
    queryFn: () => listingsApi.getFeed(params),
    // Keep feed data fresh
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get listing by ID
 */
export function useListing(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => listingsApi.getListingById(id),
    enabled: enabled && !!id,
  });
}

// ============================================================================
// Listing Mutations
// ============================================================================

/**
 * Create listing mutation
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ListingCreate) => listingsApi.createListing(data),
    onSuccess: () => {
      // Invalidate feed and listings
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.lists() });
    },
  });
}

/**
 * Update listing mutation
 */
export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ListingUpdate }) =>
      listingsApi.updateListing(id, data),
    onSuccess: (updatedListing) => {
      // Update cache for this specific listing
      queryClient.setQueryData(
        queryKeys.listings.detail(updatedListing.id),
        updatedListing
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.lists() });
    },
  });
}

/**
 * Delete listing mutation
 */
export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => listingsApi.deleteListing(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.lists() });
    },
  });
}

// ============================================================================
// Tags
// ============================================================================

/**
 * Autocomplete tags - search tags for autocomplete
 */
export function useAutocompleteTags(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.listings.tags.search(query),
    queryFn: () => listingsApi.autocompleteTags(query),
    enabled: enabled && !!query && query.length > 0,
    // Keep search results fresh
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
