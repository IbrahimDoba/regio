/**
 * Banking API Client
 *
 * API calls for banking, wallet, and transaction endpoints
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  BalanceResponse,
  TransactionHistoryResponse,
  TransferRequest,
  TransactionPublic,
  PaymentRequestCreate,
  PaymentRequestPublic,
  Message,
} from '../types';

// ============================================================================
// Account & Balance
// ============================================================================

/**
 * Get current user's balance, trust level, and limits
 */
export const getBalance = async (): Promise<BalanceResponse> => {
  const response = await apiClient.get<BalanceResponse>(
    API_ENDPOINTS.BANKING.BALANCE
  );
  return response.data;
};

/**
 * Get paginated transaction history
 */
export const getHistory = async (params?: {
  page?: number;
  page_size?: number;
  days?: number;
}): Promise<TransactionHistoryResponse> => {
  const response = await apiClient.get<TransactionHistoryResponse>(
    API_ENDPOINTS.BANKING.HISTORY,
    { params }
  );
  return response.data;
};

// ============================================================================
// Transfers
// ============================================================================

/**
 * Transfer funds to another user
 */
export const transferFunds = async (
  data: TransferRequest
): Promise<TransactionPublic> => {
  const response = await apiClient.post<TransactionPublic>(
    API_ENDPOINTS.BANKING.TRANSFER,
    data
  );
  return response.data;
};

// ============================================================================
// Payment Requests
// ============================================================================

/**
 * Create a payment request (invoice)
 */
export const createPaymentRequest = async (
  data: PaymentRequestCreate
): Promise<PaymentRequestPublic> => {
  const response = await apiClient.post<PaymentRequestPublic>(
    API_ENDPOINTS.BANKING.REQUESTS.CREATE,
    data
  );
  return response.data;
};

/**
 * Get incoming payment requests (where current user is the debtor)
 */
export const getIncomingPaymentRequests = async (): Promise<
  PaymentRequestPublic[]
> => {
  const response = await apiClient.get<PaymentRequestPublic[]>(
    API_ENDPOINTS.BANKING.REQUESTS.INCOMING
  );
  return response.data;
};

/**
 * Get outgoing payment requests (where current user is the creditor)
 */
export const getOutgoingPaymentRequests = async (): Promise<
  PaymentRequestPublic[]
> => {
  const response = await apiClient.get<PaymentRequestPublic[]>(
    API_ENDPOINTS.BANKING.REQUESTS.OUTGOING
  );
  return response.data;
};

/**
 * Confirm/Pay a received payment request
 */
export const confirmPaymentRequest = async (requestId: string): Promise<Message> => {
  const response = await apiClient.post<Message>(
    API_ENDPOINTS.BANKING.REQUESTS.CONFIRM(requestId)
  );
  return response.data;
};

/**
 * Reject/Decline a received payment request
 */
export const rejectPaymentRequest = async (requestId: string): Promise<Message> => {
  const response = await apiClient.post<Message>(
    API_ENDPOINTS.BANKING.REQUESTS.REJECT(requestId)
  );
  return response.data;
};

/**
 * Cancel a payment request you sent
 */
export const cancelPaymentRequest = async (requestId: string): Promise<Message> => {
  const response = await apiClient.post<Message>(
    API_ENDPOINTS.BANKING.REQUESTS.CANCEL(requestId)
  );
  return response.data;
};

// ============================================================================
// Export
// ============================================================================

export const bankingApi = {
  getBalance,
  getHistory,
  transferFunds,
  createPaymentRequest,
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
  confirmPaymentRequest,
  rejectPaymentRequest,
  cancelPaymentRequest,
} as const;
