/**
 * Broadcasts API Client
 *
 * API calls for broadcast endpoints (admin send + user inbox)
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { BroadcastMessage, BroadcastSend } from '../types';

/**
 * Admin: Send a broadcast to filtered users
 */
export const sendBroadcast = async (data: BroadcastSend): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.BROADCASTS.SEND, data);
};

/**
 * User: Get inbox of received broadcast messages
 */
export const getBroadcastInbox = async (): Promise<BroadcastMessage[]> => {
  const response = await apiClient.get<BroadcastMessage[]>(
    API_ENDPOINTS.BROADCASTS.INBOX
  );
  return response.data;
};

/**
 * User: Mark a broadcast message as read
 */
export const markBroadcastRead = async (messageId: string): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.BROADCASTS.READ(messageId));
};

export const broadcastsApi = {
  sendBroadcast,
  getBroadcastInbox,
  markBroadcastRead,
} as const;
