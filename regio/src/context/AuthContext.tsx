'use client';

/**
 * Authentication Context
 *
 * Provides global authentication state and actions to the entire application
 * Wraps the useCurrentUser hook and provides login/logout functionality
 */

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useLogin, useLogout } from '@/lib/api';
import type { UserRich, LoginRequest } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue {
  // State
  user: UserRich | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  // Get current user from API
  const { data: user, isLoading, isError } = useCurrentUser();

  // Get mutation hooks
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Determine if user is authenticated
  const isAuthenticated = !!user && !isError;

  // Login handler
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      await loginMutation.mutateAsync(credentials);
      // On success, redirect to home
      router.push('/');
    } catch (error) {
      // Let the caller handle the error (form will display it)
      throw error;
    }
  }, [loginMutation, router]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      // Mutation automatically redirects to /auth
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, we've cleared local storage
      router.push('/auth');
    }
  }, [logoutMutation, router]);

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useAuth Hook
 *
 * Provides access to authentication state and actions
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
