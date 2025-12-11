/**
 * API Configuration
 *
 * Centralized configuration for API client
 */

export const API_CONFIG = {
  // Base URL for API requests
  // In production, this should come from environment variables
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000, // 30 seconds

  // Token storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'regio_access_token',
    REFRESH_TOKEN: 'regio_refresh_token',
    USER: 'regio_user',
  },

  // Token expiration buffer (refresh token before it expires)
  TOKEN_REFRESH_BUFFER: 60000, // 1 minute before expiration
} as const;
