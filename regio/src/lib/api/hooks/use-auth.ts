/**
 * Auth Hooks
 *
 * Custom React hooks for authentication using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../modules/auth';
import { usersApi } from '../modules/users';
import { queryKeys } from '../query-keys';
import { setAccessToken, clearAuthData } from '../client';
import type { LoginRequest } from '../types';

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Save access token
      setAccessToken(response.access_token);

      // Invalidate auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
    onError: (error) => {
      console.error('[Login Error]', error);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear auth data from storage
      clearAuthData();

      // Clear all cached data
      queryClient.clear();

      // Redirect to auth page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    },
    onError: (error) => {
      console.error('[Logout Error]', error);
      // Even if logout fails, clear local data
      clearAuthData();
      queryClient.clear();
    },
  });
}

/**
 * Get current user (me)
 * This is the primary way to check if user is authenticated
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersApi.getCurrentUser(),
    // Only enable if we have an access token
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('regio_access_token'),
    // Retry once on failure
    retry: 1,
    // If query fails, user is not authenticated
    throwOnError: false,
  });
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data, isLoading, isError } = useCurrentUser();

  return {
    isAuthenticated: !!data && !isError,
    isLoading,
    user: data,
  };
}

/**
 * Test token query - validates current access token
 */
export function useTestToken() {
  return useQuery({
    queryKey: queryKeys.auth.tokenValidation(),
    queryFn: () => authApi.testToken(),
    // Don't automatically fetch, only when explicitly called
    enabled: false,
    // Don't retry on failure
    retry: false,
  });
}
