/**
 * Query Keys Factory
 *
 * Centralized query key management for TanStack Query
 * This ensures consistent cache keys across the application
 *
 * Usage:
 * - queryKeys.users.all() -> ['users']
 * - queryKeys.users.detail(id) -> ['users', 'detail', id]
 * - queryKeys.listings.feed(params) -> ['listings', 'feed', params]
 */

import type {
  FeedParams,
  PaginationParams,
  PaymentStatus,
} from './types';

export const queryKeys = {
  // ============================================================================
  // Auth
  // ============================================================================
  auth: {
    all: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
    tokenValidation: () => ['auth', 'token-validation'] as const,
  },

  // ============================================================================
  // Users
  // ============================================================================
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: PaginationParams) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    me: () => [...queryKeys.users.all(), 'me'] as const,
    byCode: (code: string) => [...queryKeys.users.all(), 'code', code] as const,
    invites: () => [...queryKeys.users.all(), 'invites'] as const,
  },

  // ============================================================================
  // Banking
  // ============================================================================
  banking: {
    all: () => ['banking'] as const,
    balance: () => [...queryKeys.banking.all(), 'balance'] as const,
    account: () => [...queryKeys.banking.all(), 'account'] as const,
    transactions: {
      all: () => [...queryKeys.banking.all(), 'transactions'] as const,
      lists: () => [...queryKeys.banking.transactions.all(), 'list'] as const,
      list: (filters?: PaginationParams) =>
        [...queryKeys.banking.transactions.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.banking.transactions.all(), 'detail', id] as const,
    },
    paymentRequests: {
      all: () => [...queryKeys.banking.all(), 'payment-requests'] as const,
      lists: () => [...queryKeys.banking.paymentRequests.all(), 'list'] as const,
      list: (filters?: { status?: PaymentStatus } & PaginationParams) =>
        [...queryKeys.banking.paymentRequests.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.banking.paymentRequests.all(), 'detail', id] as const,
    },
  },

  // ============================================================================
  // Listings
  // ============================================================================
  listings: {
    all: () => ['listings'] as const,
    lists: () => [...queryKeys.listings.all(), 'list'] as const,
    list: (filters?: PaginationParams) =>
      [...queryKeys.listings.lists(), filters] as const,
    feed: (params?: FeedParams) => [...queryKeys.listings.all(), 'feed', params] as const,
    details: () => [...queryKeys.listings.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.listings.details(), id] as const,
    myListings: () => [...queryKeys.listings.all(), 'my-listings'] as const,
    tags: {
      all: () => [...queryKeys.listings.all(), 'tags'] as const,
      search: (query?: string) =>
        [...queryKeys.listings.tags.all(), 'search', query] as const,
    },
  },

  // ============================================================================
  // Admin
  // ============================================================================
  admin: {
    all: () => ['admin'] as const,
    tags: {
      all: () => [...queryKeys.admin.all(), 'tags'] as const,
      detail: (id: number) => [...queryKeys.admin.tags.all(), 'detail', id] as const,
    },
  },
} as const;

/**
 * Type helper to infer query key types
 */
export type QueryKeys = typeof queryKeys;

/**
 * Helper to invalidate related queries
 * Example: When creating a listing, invalidate all listing feeds
 */
export const invalidationGroups = {
  // Invalidate all user-related queries
  user: [queryKeys.users.all()],

  // Invalidate all banking-related queries
  banking: [queryKeys.banking.all()],

  // Invalidate all listing-related queries
  listings: [queryKeys.listings.all()],

  // Invalidate feed queries (after creating/updating listings)
  listingsFeed: [queryKeys.listings.lists(), queryKeys.listings.feed()],

  // Invalidate transaction lists (after transfer)
  transactions: [queryKeys.banking.transactions.lists()],

  // Invalidate payment request lists (after creating/updating payment requests)
  paymentRequests: [queryKeys.banking.paymentRequests.lists()],
} as const;
