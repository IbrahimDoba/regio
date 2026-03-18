/**
 * Chat API Module
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  RoomResponse,
  ChatRoomsResponse,
  ListingInquiryRequest,
} from '../types';

/**
 * Get list of chat rooms for the current user
 */
export async function getMyRooms(): Promise<ChatRoomsResponse> {
  const response = await apiClient.get<ChatRoomsResponse>(API_ENDPOINTS.CHAT.ROOMS);
  return response.data;
}

/**
 * Create or get existing room for a listing inquiry
 */
export async function createListingInquiry(data: ListingInquiryRequest): Promise<RoomResponse> {
  const response = await apiClient.post<RoomResponse>(API_ENDPOINTS.CHAT.INQUIRY, data);
  return response.data;
}
