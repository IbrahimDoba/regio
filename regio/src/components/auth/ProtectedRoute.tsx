'use client';

import React, { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  verifiedOnly?: boolean;
}

export default function ProtectedRoute({ children, verifiedOnly = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (verifiedOnly && user && user.verification_status !== 'VERIFIED') {
      router.push('/verification');
    }
  }, [isAuthenticated, isLoading, user, verifiedOnly, router, pathname]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[480px] mx-auto min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-offer)]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (verifiedOnly && user && user.verification_status !== 'VERIFIED') return null;

  return <>{children}</>;
}
