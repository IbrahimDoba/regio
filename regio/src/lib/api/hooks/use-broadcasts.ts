/**
 * Broadcast Hooks
 *
 * Custom React hooks for broadcast operations using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { broadcastsApi } from '../modules/broadcasts';
import { queryKeys } from '../query-keys';
import type { BroadcastSend } from '../types';

/**
 * User: Poll broadcast inbox every 30 seconds
 */
export function useBroadcastInbox() {
  return useQuery({
    queryKey: queryKeys.broadcasts.inbox(),
    queryFn: () => broadcastsApi.getBroadcastInbox(),
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
  });
}

/**
 * Admin: Send a broadcast message
 */
export function useSendBroadcast() {
  return useMutation({
    mutationFn: (data: BroadcastSend) => broadcastsApi.sendBroadcast(data),
  });
}

/**
 * User: Mark a broadcast message as read
 */
export function useMarkBroadcastRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => broadcastsApi.markBroadcastRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.inbox() });
    },
  });
}
