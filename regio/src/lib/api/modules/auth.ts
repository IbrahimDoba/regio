/**
 * Auth API Client
 *
 * API calls for authentication endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { LoginRequest, TokenResponse, UserPublic, Message } from '../types';

/**
 * Login with email/user_code and password
 * Returns access token in body and refresh token in HttpOnly cookie
 */
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  // FastAPI expects form data for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);

  if (data.grant_type) formData.append('grant_type', data.grant_type);
  if (data.scope) formData.append('scope', data.scope);
  if (data.client_id) formData.append('client_id', data.client_id);
  if (data.client_secret) formData.append('client_secret', data.client_secret);

  const response = await apiClient.post<TokenResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
};

/**
 * Logout (invalidates tokens)
 * Clears HttpOnly cookie
 */
export const logout = async (): Promise<Message> => {
  const response = await apiClient.post<Message>(API_ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

/**
 * Refresh access token using refresh token (stored in HttpOnly cookie)
 * Performs token rotation - returns new access token and sets new refresh token cookie
 */
export const refreshToken = async (): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(API_ENDPOINTS.AUTH.REFRESH);
  return response.data;
};

/**
 * Validate current access token
 * Returns user data if token is valid
 */
export const testToken = async (): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>(API_ENDPOINTS.AUTH.TEST_TOKEN);
  return response.data;
};

/**
 * Auth API module
 */
export const authApi = {
  login,
  logout,
  refreshToken,
  testToken,
} as const;
