/**
 * Chat Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../query-keys';
import type { ChatRoomsResponse, RoomResponse, ListingInquiryRequest, ChatMessage } from '../types';
import type { ChatRoomSummary, LocalNotification } from '@/context/RealTimeContext';
import { getMyRooms, createListingInquiry } from '../modules/chat';

/**
 * Hook to fetch the current user's chat rooms from the backend API.
 * Used for initial load; the Matrix SDK context keeps this up to date via setQueryData.
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

/**
 * Chat rooms enriched with unread counts and last-message previews.
 * Data is pushed into the cache by RealTimeContext whenever the Matrix SDK
 * syncs, so navigation back to the chat list shows instantly without re-fetching.
 */
export function useChatRooms() {
  return useQuery<ChatRoomSummary[]>({
    queryKey: QUERY_KEYS.chat.rooms(),
    // queryFn returns empty; actual data comes from RealTimeContext via setQueryData.
    queryFn: (): ChatRoomSummary[] => [],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    initialData: [],
  });
}

/**
 * Messages for a specific chat room.
 * RealTimeContext pushes updates via setQueryData on every timeline event and
 * on joinRoom, so navigating back to a room shows the cached messages instantly
 * and new messages appear without requiring a re-join.
 *
 * Call invalidateQueries(queryKeys.chat.messages(roomId)) to force a re-sync
 * from the Matrix SDK if needed.
 */
export function useRoomMessages(roomId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: QUERY_KEYS.chat.messages(roomId ?? '_none'),
    queryFn: (): ChatMessage[] => [],
    staleTime: Infinity,
    enabled: !!roomId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    initialData: [],
  });
}

/**
 * In-app notification list (new chat messages, system alerts).
 * Backed by localStorage with a 24-hour TTL; RealTimeContext keeps the cache
 * up to date. Components reading from this hook re-render automatically when
 * new notifications arrive.
 */
export function useNotifications() {
  return useQuery<LocalNotification[]>({
    queryKey: QUERY_KEYS.chat.notifications(),
    queryFn: (): LocalNotification[] => [],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    initialData: [],
  });
}
