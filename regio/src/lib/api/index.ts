/**
 * API Library Index
 *
 * Main entry point for the API layer
 *
 * Usage:
 * import { useLogin, useFeed, api, queryKeys } from '@/lib/api';
 */

// Export configuration
export { API_CONFIG } from './config';

// Export endpoints
export { API_ENDPOINTS } from './endpoints';

// Export API client
export { default as apiClient } from './client';
export * from './client';

// Export types
export * from './types';

// Export query keys
export * from './query-keys';

// Export API modules (for direct API calls)
export * from './modules';

// Export hooks (for React components)
export * from './hooks';

// Export QueryProvider component
export { QueryProvider } from './query-provider';
