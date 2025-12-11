/**
 * API Modules Index
 *
 * Central export point for all API modules
 */

export { authApi } from './auth';
export { usersApi } from './users';
export { bankingApi } from './banking';
export { listingsApi } from './listings';
export { adminApi } from './admin';

// Export all API functions in a single object for convenience
export const api = {
  auth: authApi,
  users: usersApi,
  banking: bankingApi,
  listings: listingsApi,
  admin: adminApi,
} as const;

// Re-export from auth
export * from './auth';

// Re-export from users
export * from './users';

// Re-export from banking
export * from './banking';

// Re-export from listings
export * from './listings';

// Re-export from admin
export * from './admin';
