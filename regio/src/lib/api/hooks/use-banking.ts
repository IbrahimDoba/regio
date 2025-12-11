/**
 * Banking Hooks
 *
 * Custom React hooks for banking and wallet operations using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bankingApi } from '../modules/banking';
import { queryKeys } from '../query-keys';
import type {
  TransferRequest,
  PaymentRequestCreate,
} from '../types';

// ============================================================================
// Balance & History Queries
// ============================================================================

/**
 * Get current user's balance, trust level, and limits
 */
export function useBalance() {
  return useQuery({
    queryKey: queryKeys.banking.balance(),
    queryFn: () => bankingApi.getBalance(),
    // Refetch balance more frequently
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get paginated transaction history
 */
export function useHistory(params?: {
  page?: number;
  page_size?: number;
  days?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.banking.transactions.all(), 'history', params] as const,
    queryFn: () => bankingApi.getHistory(params),
  });
}

// ============================================================================
// Transfer Mutation
// ============================================================================

/**
 * Transfer funds mutation
 */
export function useTransferFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferRequest) => bankingApi.transferFunds(data),
    onSuccess: () => {
      // Invalidate balance and transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.banking.balance() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.transactions.all(),
      });
    },
  });
}

// ============================================================================
// Payment Request Queries
// ============================================================================

/**
 * Get incoming payment requests (where current user is debtor)
 */
export function useIncomingPaymentRequests() {
  return useQuery({
    queryKey: [...queryKeys.banking.paymentRequests.all(), 'incoming'] as const,
    queryFn: () => bankingApi.getIncomingPaymentRequests(),
  });
}

/**
 * Get outgoing payment requests (where current user is creditor)
 */
export function useOutgoingPaymentRequests() {
  return useQuery({
    queryKey: [...queryKeys.banking.paymentRequests.all(), 'outgoing'] as const,
    queryFn: () => bankingApi.getOutgoingPaymentRequests(),
  });
}

// ============================================================================
// Payment Request Mutations
// ============================================================================

/**
 * Create payment request mutation
 */
export function useCreatePaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentRequestCreate) => bankingApi.createPaymentRequest(data),
    onSuccess: () => {
      // Invalidate payment requests list
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.paymentRequests.all(),
      });
    },
  });
}

/**
 * Confirm/Pay a payment request mutation
 */
export function useConfirmPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => bankingApi.confirmPaymentRequest(requestId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.paymentRequests.all(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.banking.balance() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.transactions.all(),
      });
    },
  });
}

/**
 * Reject/Decline a payment request mutation
 */
export function useRejectPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => bankingApi.rejectPaymentRequest(requestId),
    onSuccess: () => {
      // Invalidate payment requests list
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.paymentRequests.all(),
      });
    },
  });
}

/**
 * Cancel a payment request mutation (for sender)
 */
export function useCancelPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => bankingApi.cancelPaymentRequest(requestId),
    onSuccess: () => {
      // Invalidate payment requests list
      queryClient.invalidateQueries({
        queryKey: queryKeys.banking.paymentRequests.all(),
      });
    },
  });
}
