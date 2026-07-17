/**
 * Admin Hooks
 *
 * Custom React hooks for admin operations using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../modules/admin';
import { queryKeys } from '../query-keys';
import type {
  AdminUserUpdate,
  TagsAdminListResponse,
  TagUpdate,
  DisputeFilter,
  DisputeResolveRequest,
} from '../types';

// ============================================================================
// Dashboard & Stats
// ============================================================================

/**
 * Get dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: [...queryKeys.admin.all(), 'stats'] as const,
    queryFn: () => adminApi.getDashboardStats(),
    // Refetch stats more frequently
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================================
// User Management
// ============================================================================

/**
 * List users with balances (admin view)
 */
export function useListUsersRich(params?: {
  q?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.admin.all(), 'users-rich', params] as const,
    queryFn: () => adminApi.listUsersRich(params),
  });
}

/**
 * Update user details (admin force update)
 */
export function useUpdateUserDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userCode, data }: { userCode: string; data: AdminUserUpdate }) =>
      adminApi.updateUserDetails(userCode, data),
    onSuccess: () => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all() });
    },
  });
}

/**
 * Toggle user active status (ban/unban)
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userCode: string) => adminApi.toggleUserActive(userCode),
    onSuccess: () => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all() });
    },
  });
}

// ============================================================================
// Tag Management
// ============================================================================

/**
 * Get tags with usage counts, search, and pagination
 */
export function useAdminTags(params?: {
  pending?: boolean;
  skip?: number;
  limit?: number;
  q?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.tags.list(params),
    queryFn: () => adminApi.getTags(params),
  });
}

/**
 * Update or approve a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: string; data: TagUpdate }) =>
      adminApi.updateTag(tagId, data),
    onSuccess: () => {
      // Invalidate tag queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tags.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.tags.all() });
      // Renaming or translating a tag changes the labels listings render
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all() });
    },
  });
}

/**
 * Delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => adminApi.deleteTag(tagId),
    onSuccess: (_, tagId) => {
      // Optimistically remove the deleted tag from all cached admin tag lists
      // so the UI updates instantly without waiting for the background refetch.
      queryClient.setQueriesData<TagsAdminListResponse>(
        { queryKey: queryKeys.admin.tags.all() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((t) => String(t.id) !== tagId),
            count: Math.max(0, old.count - 1),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tags.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.tags.all() });
      // Deleting a tag cascades to listing_tags, so cached listings still show it
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all() });
    },
  });
}

// ============================================================================
// Dispute Management
// ============================================================================

/**
 * List disputes, scoped by filter (unresolved | resolved | all).
 */
export function useDisputes(filter: DisputeFilter = 'unresolved') {
  return useQuery({
    queryKey: [...queryKeys.admin.all(), 'disputes', filter] as const,
    queryFn: () => adminApi.listDisputes(filter),
  });
}

/**
 * Resolve a dispute
 */
export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string;
      data: DisputeResolveRequest;
    }) => adminApi.resolveDispute(requestId, data),
    onSuccess: () => {
      // Invalidate dispute and payment request queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.paymentRequests.all(),
      });
    },
  });
}
