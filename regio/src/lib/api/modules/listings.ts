/**
 * Listings API Client
 *
 * API calls for listings and feed endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ListingPublic,
  ListingCreate,
  ListingUpdate,
  FeedParams,
  FeedResponse,
  TagAutocomplete,
} from '../types';

// ============================================================================
// Feed
// ============================================================================

/**
 * Get main feed with filters
 * Supports filtering by categories, tags, text search, and cursor-based pagination
 */
export const getFeed = async (params?: FeedParams): Promise<FeedResponse> => {
  const response = await apiClient.get<FeedResponse>(
    API_ENDPOINTS.LISTINGS.FEED,
    { params }
  );
  return response.data;
};

// ============================================================================
// Listings CRUD
// ============================================================================

/**
 * Create a new listing
 */
export const createListing = async (
  data: ListingCreate
): Promise<ListingPublic> => {
  const response = await apiClient.post<ListingPublic>(
    API_ENDPOINTS.LISTINGS.BASE,
    data
  );
  return response.data;
};

/**
 * Get listing by ID
 */
export const getListingById = async (id: string): Promise<ListingPublic> => {
  const response = await apiClient.get<ListingPublic>(
    API_ENDPOINTS.LISTINGS.BY_ID(id)
  );
  return response.data;
};

/**
 * Update a listing (partial update, owner only)
 */
export const updateListing = async (
  id: string,
  data: ListingUpdate
): Promise<ListingPublic> => {
  const response = await apiClient.patch<ListingPublic>(
    API_ENDPOINTS.LISTINGS.BY_ID(id),
    data
  );
  return response.data;
};

/**
 * Delete a listing (owner and admins only)
 */
export const deleteListing = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.LISTINGS.BY_ID(id));
};

// ============================================================================
// Tags
// ============================================================================

/**
 * Autocomplete tags - search tags for autocomplete
 */
export const autocompleteTags = async (
  query: string
): Promise<TagAutocomplete[]> => {
  const response = await apiClient.get<TagAutocomplete[]>(
    API_ENDPOINTS.LISTINGS.TAGS,
    {
      params: { q: query },
    }
  );
  return response.data;
};

// ============================================================================
// Export
// ============================================================================

export const listingsApi = {
  getFeed,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  autocompleteTags,
} as const;
