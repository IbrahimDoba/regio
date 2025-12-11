/**
 * Axios Client
 *
 * Configured axios instance with interceptors for:
 * - Authentication (JWT token injection)
 * - Token refresh on 401 errors
 * - Error handling
 * - Request/response logging (dev only)
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { API_CONFIG } from './config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiError, TokenResponse } from './types';

// ============================================================================
// Token Management
// ============================================================================

/**
 * Get access token from storage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Set access token in storage
 */
export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Remove access token from storage
 */
export const removeAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Clear all auth data from storage
 */
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
};

// ============================================================================
// Axios Instance
// ============================================================================

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for HttpOnly cookies (refresh token)
});

// ============================================================================
// Request Interceptor
// ============================================================================

/**
 * Add access token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh
 */
const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh access token using refresh token (stored in HttpOnly cookie)
 */
const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post<TokenResponse>(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      {
        withCredentials: true, // Send refresh token cookie
      }
    );

    const { access_token } = response.data;
    setAccessToken(access_token);
    return access_token;
  } catch (error) {
    // If refresh fails, clear auth data and redirect to login
    clearAuthData();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    throw error;
  }
};

/**
 * Handle successful responses
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry refresh or login endpoints
      if (
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH) ||
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN)
      ) {
        return Promise.reject(error);
      }

      // If already refreshing, wait for new token
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Export
// ============================================================================

export default apiClient;
