/**
 * API Endpoints
 *
 * Centralized URL management for all API endpoints
 * Generated from Swagger/OpenAPI documentation
 */

export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/healthcheck',

  // ============================================================================
  // Authentication Endpoints
  // ============================================================================
  AUTH: {
    LOGIN: '/auth/login/access-token',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    TEST_TOKEN: '/auth/login/test-token',
  },

  // ============================================================================
  // User Endpoints
  // ============================================================================
  USERS: {
    BASE: '/users',
    SEARCH: '/users/search',
    REGISTER: '/users/register',
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    BY_CODE: (userCode: string) => `/users/${userCode}`,
    INVITES: '/users/invites',
    REQUEST_INVITES: '/users/invites/request',
  },

  // ============================================================================
  // Banking Endpoints
  // ============================================================================
  BANKING: {
    BALANCE: '/banking/balance',
    HISTORY: '/banking/history',
    TRANSFER: '/banking/transfer',

    // Payment Requests
    REQUESTS: {
      CREATE: '/banking/requests',
      INCOMING: '/banking/requests/incoming',
      OUTGOING: '/banking/requests/outgoing',
      CONFIRM: (requestId: string) => `/banking/requests/${requestId}/confirm`,
      REJECT: (requestId: string) => `/banking/requests/${requestId}/reject`,
      CANCEL: (requestId: string) => `/banking/requests/${requestId}/cancel`,
    },
  },

  // ============================================================================
  // Listings Endpoints
  // ============================================================================
  LISTINGS: {
    BASE: '/listings/',
    FEED: '/listings/feed',
    TAGS: '/listings/tags',
    BY_ID: (listingId: string) => `/listings/${listingId}`,
  },

  // ============================================================================
  // Admin Endpoints
  // ============================================================================
  ADMIN: {
    STATS: '/admin/stats',

    // User Management
    USERS: '/admin/users',
    USER_BY_CODE: (userCode: string) => `/admin/users/${userCode}`,
    TOGGLE_USER: (userCode: string) => `/admin/users/${userCode}/toggle`,

    // Tag Management
    TAGS: '/admin/tags',
    TAG_BY_ID: (tagId: string) => `/admin/tags/${tagId}`,

    // Dispute Management
    DISPUTES: '/admin/disputes',
    RESOLVE_DISPUTE: (requestId: string) => `/admin/disputes/${requestId}/resolve`,
  },
} as const;
