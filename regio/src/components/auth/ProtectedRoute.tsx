'use client';

/**
 * Protected Route Component
 *
 * Wraps pages that require authentication
 * Redirects unauthenticated users to /auth
 * Shows loading spinner while checking auth status
 */

import React, { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // If not loading and not authenticated, redirect to auth page
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f8f8]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-offer)]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
