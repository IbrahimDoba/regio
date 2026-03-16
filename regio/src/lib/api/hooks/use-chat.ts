/**
 * Chat Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../query-keys';
import type { ChatRoomsResponse, RoomResponse, ListingInquiryRequest } from '../types';
import { getMyRooms, createListingInquiry } from '../modules/chat';

/**
 * Hook to fetch the current user's chat rooms
 */
export function useMyRooms() {
  return useQuery<ChatRoomsResponse>({
    queryKey: QUERY_KEYS.chat.rooms(),
    queryFn: getMyRooms,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to create or get a listing inquiry room
 */
export function useCreateListingInquiry() {
  const queryClient = useQueryClient();

  return useMutation<RoomResponse, Error, ListingInquiryRequest>({
    mutationFn: createListingInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    },
  });
}
