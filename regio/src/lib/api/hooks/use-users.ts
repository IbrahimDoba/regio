/**
 * Users Hooks
 *
 * Custom React hooks for user management using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../modules/users";
import { queryKeys } from "../query-keys";
import type { UserCreate, UserUpdate, PaginationParams } from "../types";

// ============================================================================
// User Queries
// ============================================================================

/**
 * Get current user (me)
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersApi.getCurrentUser(),
  });
}

/**
 * Get user by code
 */
export function useUser(code: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.byCode(code),
    queryFn: () => usersApi.getUserByCode(code),
    enabled: enabled && !!code,
  });
}

/**
 * List users (admin only)
 */
export function useListUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.listUsers(params),
  });
}

/**
 * Search users by name or code
 */
export function useSearchUsers(query: string, limit?: number, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.users.all(), "search", query, limit] as const,
    queryFn: () => usersApi.searchUsers({ q: query, limit }),
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// User Mutations
// ============================================================================

/**
 * Register user mutation
 */
export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.registerUser(data),
    onSuccess: () => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

/**
 * Update current user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdate) => usersApi.updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      // Update the cache with new user data
      queryClient.setQueryData(queryKeys.users.me(), updatedUser);

      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
}

// ============================================================================
// Invite Queries & Mutations
// ============================================================================

/**
 * Get user's invite codes (limited to 3 most recent)
 */
export function useUserInvites() {
  return useQuery({
    queryKey: queryKeys.users.invites(),
    queryFn: () => usersApi.getUserInvites(),
  });
}

/**
 * Request new invites mutation
 * Voids existing unused invites and generates 3 new ones
 */
export function useRequestNewInvites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.requestNewInvites(),
    onSuccess: () => {
      // Invalidate invites query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.invites() });
    },
  });
}
