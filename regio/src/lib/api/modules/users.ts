/**
 * Users API Client
 *
 * API calls for user management endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  UserPublic,
  UserCreate,
  UserUpdate,
  UsersListResponse,
  InvitePublic,
  PaginationParams,
} from '../types';

// ============================================================================
// User CRUD
// ============================================================================

/**
 * Get current user (me)
 */
export const getCurrentUser = async (): Promise<UserPublic> => {
  const response = await apiClient.get<UserPublic>(API_ENDPOINTS.USERS.ME);
  return response.data;
};

/**
 * Get user by code (admin only)
 */
export const getUserByCode = async (code: string): Promise<UserPublic> => {
  const response = await apiClient.get<UserPublic>(
    API_ENDPOINTS.USERS.BY_CODE(code)
  );
  return response.data;
};

/**
 * List users with pagination (admin only)
 */
export const listUsers = async (
  params?: PaginationParams
): Promise<UsersListResponse> => {
  const response = await apiClient.get<UsersListResponse>(
    API_ENDPOINTS.USERS.BASE,
    { params }
  );
  return response.data;
};

/**
 * Search users by name or code
 */
export const searchUsers = async (params: {
  q: string;
  limit?: number;
}): Promise<UserPublic[]> => {
  const response = await apiClient.get<UserPublic[]>(
    API_ENDPOINTS.USERS.SEARCH,
    { params }
  );
  return response.data;
};

/**
 * Register a new user
 */
export const registerUser = async (data: UserCreate): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>(
    API_ENDPOINTS.USERS.REGISTER,
    data
  );
  return response.data;
};

/**
 * Update current user profile
 */
export const updateCurrentUser = async (data: UserUpdate): Promise<UserPublic> => {
  const response = await apiClient.patch<UserPublic>(
    API_ENDPOINTS.USERS.UPDATE_ME,
    data
  );
  return response.data;
};

// ============================================================================
// Invites
// ============================================================================

/**
 * Get current user's invite codes (limited to 3 most recent)
 */
export const getUserInvites = async (): Promise<InvitePublic[]> => {
  const response = await apiClient.get<InvitePublic[]>(
    API_ENDPOINTS.USERS.INVITES
  );
  return response.data;
};

/**
 * Request new invites (voids existing unused invites and generates 3 new ones)
 */
export const requestNewInvites = async (): Promise<InvitePublic[]> => {
  const response = await apiClient.get<InvitePublic[]>(
    API_ENDPOINTS.USERS.REQUEST_INVITES
  );
  return response.data;
};

// ============================================================================
// Export
// ============================================================================

export const usersApi = {
  getCurrentUser,
  getUserByCode,
  listUsers,
  searchUsers,
  registerUser,
  updateCurrentUser,
  getUserInvites,
  requestNewInvites,
} as const;
