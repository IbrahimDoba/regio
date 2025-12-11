/**
 * Admin API Client
 *
 * API calls for admin endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  AdminStatsResponse,
  UsersRichListResponse,
  AdminUserUpdate,
  UserPublic,
  TagPublic,
  TagUpdate,
  DisputePublic,
  DisputeResolveRequest,
  Message,
} from '../types';

// ============================================================================
// Dashboard & Stats
// ============================================================================

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (): Promise<AdminStatsResponse> => {
  const response = await apiClient.get<AdminStatsResponse>(
    API_ENDPOINTS.ADMIN.STATS
  );
  return response.data;
};

// ============================================================================
// User Management
// ============================================================================

/**
 * List users with balances (admin view)
 */
export const listUsersRich = async (params?: {
  q?: string;
  skip?: number;
  limit?: number;
}): Promise<UsersRichListResponse> => {
  const response = await apiClient.get<UsersRichListResponse>(
    API_ENDPOINTS.ADMIN.USERS,
    { params }
  );
  return response.data;
};

/**
 * Update user details (admin force update)
 */
export const updateUserDetails = async (
  userCode: string,
  data: AdminUserUpdate
): Promise<UserPublic> => {
  const response = await apiClient.patch<UserPublic>(
    API_ENDPOINTS.ADMIN.USER_BY_CODE(userCode),
    data
  );
  return response.data;
};

/**
 * Toggle user active status (ban/unban)
 */
export const toggleUserActive = async (userCode: string): Promise<UserPublic> => {
  const response = await apiClient.patch<UserPublic>(
    API_ENDPOINTS.ADMIN.TOGGLE_USER(userCode)
  );
  return response.data;
};

// ============================================================================
// Tag Management
// ============================================================================

/**
 * Get tags with usage counts
 */
export const getTags = async (params?: {
  pending?: boolean;
}): Promise<TagPublic[]> => {
  const response = await apiClient.get<TagPublic[]>(
    API_ENDPOINTS.ADMIN.TAGS,
    { params }
  );
  return response.data;
};

/**
 * Update or approve a tag
 */
export const updateTag = async (
  tagId: string,
  data: TagUpdate
): Promise<string> => {
  const response = await apiClient.patch<string>(
    API_ENDPOINTS.ADMIN.TAG_BY_ID(tagId),
    data
  );
  return response.data;
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.ADMIN.TAG_BY_ID(tagId));
};

// ============================================================================
// Dispute Management
// ============================================================================

/**
 * List pending disputes
 */
export const listPendingDisputes = async (): Promise<DisputePublic[]> => {
  const response = await apiClient.get<DisputePublic[]>(
    API_ENDPOINTS.ADMIN.DISPUTES
  );
  return response.data;
};

/**
 * Resolve a dispute
 */
export const resolveDispute = async (
  requestId: string,
  data: DisputeResolveRequest
): Promise<Message> => {
  const response = await apiClient.post<Message>(
    API_ENDPOINTS.ADMIN.RESOLVE_DISPUTE(requestId),
    data
  );
  return response.data;
};

// ============================================================================
// Export
// ============================================================================

export const adminApi = {
  getDashboardStats,
  listUsersRich,
  updateUserDetails,
  toggleUserActive,
  getTags,
  updateTag,
  deleteTag,
  listPendingDisputes,
  resolveDispute,
} as const;
