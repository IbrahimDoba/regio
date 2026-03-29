/**
 * Chat API Module — Matrix-based endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  RoomResponse,
  ChatRoomsResponse,
  ListingInquiryRequest,
  MatrixTokenResponse,
} from '../types';

/**
 * Get list of chat rooms for the current user (from our DB, not Matrix)
 */
export async function getMyRooms(): Promise<ChatRoomsResponse> {
  const response = await apiClient.get<ChatRoomsResponse>(API_ENDPOINTS.CHAT.ROOMS);
  return response.data;
}

/**
 * Create or get existing room for a listing inquiry.
 * Returns matrix_room_id so the frontend SDK can join.
 */
export async function createListingInquiry(data: ListingInquiryRequest): Promise<RoomResponse> {
  const response = await apiClient.post<RoomResponse>(API_ENDPOINTS.CHAT.INQUIRY, data);
  return response.data;
}

/**
 * Get (or provision) Matrix credentials for the current user.
 */
export async function getMatrixToken(): Promise<MatrixTokenResponse> {
  const response = await apiClient.post<MatrixTokenResponse>(API_ENDPOINTS.CHAT.MATRIX_TOKEN);
  return response.data;
}
