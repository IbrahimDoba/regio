/**
 * Listings API Module
 */

import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  ListingPublic,
  ListingCreate,
  ListingUpdate,
  FeedResponse,
  TagPublic,
  FeedParams,
} from "../types";

/**
 * Get the main feed of listings
 */
export const getFeed = async (params?: FeedParams): Promise<FeedResponse> => {
  // Convert array params to comma-separated if needed, depending on how backend expects it.
  // FastAPI handles repeated query params like ?categories=A&categories=B automatically.
  // Axios handles array params by default as ?categories[]=A or repeated keys.
  // We'll pass params directly to apiClient which uses axios.

  const response = await apiClient.get<FeedResponse>(
    API_ENDPOINTS.LISTINGS.FEED,
    {
      params,
    }
  );
  return response.data;
};

/**
 * Get a single listing by ID
 */
export const getListing = async (listingId: string): Promise<ListingPublic> => {
  const response = await apiClient.get<ListingPublic>(
    API_ENDPOINTS.LISTINGS.BY_ID(listingId)
  );
  return response.data;
};

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
 * Update an existing listing
 */
export const updateListing = async (
  listingId: string,
  data: ListingUpdate
): Promise<ListingPublic> => {
  const response = await apiClient.patch<ListingPublic>(
    API_ENDPOINTS.LISTINGS.BY_ID(listingId),
    data
  );
  return response.data;
};

/**
 * Delete a listing
 */
export const deleteListing = async (listingId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.LISTINGS.BY_ID(listingId));
};

/**
 * Search tags for autocomplete
 */
export const searchTags = async (q: string): Promise<TagPublic[]> => {
  const response = await apiClient.get<TagPublic[]>(
    API_ENDPOINTS.LISTINGS.TAGS,
    {
      params: { q },
    }
  );
  return response.data;
};

// ============================================================================
// Export
// ============================================================================

export const listingsApi = {
  getFeed,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  searchTags,
} as const;
