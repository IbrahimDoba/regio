/**
 * API Types
 *
 * TypeScript types for API requests and responses
 * Generated from Swagger/OpenAPI documentation
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiError {
  detail: string | Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

export interface Message {
  message: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  username: string; // email or user_code
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string | null;
  client_secret?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ============================================================================
// User Types
// ============================================================================

export type TrustLevel = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
export type VerificationStatus = 'PENDING' | 'VERIFIED';
export type Language = 'EN' | 'DE' | 'HU';
export type UserRole = 'User' | 'Admin';

export interface UserPublic {
  user_code: string;
  email: string;
  first_name: string;
  last_name: string;
  trust_level: TrustLevel;
  created_at: string;
}

export interface UserRich {
  user_code: string;
  full_name: string;
  email: string;
  balance_time: number;
  balance_regio: string;
  trust_level: TrustLevel;
  verification_status: VerificationStatus;
  role: UserRole;
  is_active: boolean;
  is_system_admin: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface UserCreate {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  password: string;
  invite_code: string;
  address?: string | null;
}

export interface UserUpdate {
  address?: string | null;
  language?: Language;
}

export interface AdminUserUpdate extends UserUpdate {
  first_name?: string;
  last_name?: string;
  trust_level?: TrustLevel;
  verification_status?: VerificationStatus;
}

export interface UsersListResponse {
  data: UserPublic[];
  count: number;
}

export interface UsersRichListResponse {
  data: UserRich[];
  count: number;
}

// ============================================================================
// Invite Types
// ============================================================================

export interface InvitePublic {
  code: string;
  uses_left: number;
  is_used: boolean;
  expires_at: string | null;
}

// ============================================================================
// Banking Types
// ============================================================================

export interface BalanceResponse {
  user_code: string;
  trust_level: TrustLevel;
  balance: {
    time: number; // in minutes
    regio: string; // Decimal as string
  };
  limits: {
    max_debt_time: number;
    max_debt_regio: string;
    available_time: number;
    available_regio: string;
  };
  total_time_earned: number;
}

export type TransactionType = 'INCOMING' | 'OUTGOING';

export interface TransactionPublic {
  id: string;
  date: string;
  type: TransactionType;
  other_party_code: string;
  other_party_name: string;
  amount_time: number;
  amount_regio: string;
  reference: string | null;
  is_system_fee: boolean;
}

export interface TransactionHistoryResponse {
  data: TransactionPublic[];
  meta: PaginationMeta;
}

export interface TransferRequest {
  receiver_code: string;
  amount_time?: number;
  amount_regio?: string;
  reference?: string | null;
}

export type PaymentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'DISPUTED';

export interface PaymentRequestPublic {
  id: string;
  creditor_code: string;
  creditor_name: string;
  debtor_code: string;
  debtor_name: string;
  amount_time: number;
  amount_regio: string;
  description: string | null;
  status: PaymentRequestStatus;
  created_at: string;
}

export interface PaymentRequestCreate {
  debtor_code: string;
  amount_time?: number;
  amount_regio?: string;
  description?: string | null;
}

// ============================================================================
// Listing Types
// ============================================================================

export type ListingCategory =
  | 'OFFER_SERVICE'
  | 'SEARCH_SERVICE'
  | 'SELL_PRODUCT'
  | 'SEARCH_PRODUCT'
  | 'OFFER_RENTAL'
  | 'RIDE_SHARE'
  | 'EVENT_WORKSHOP';

export type ListingStatus = 'ACTIVE' | 'INACTIVE';

export interface ListingPublic {
  id: string;
  owner_code: string;
  owner_name: string;
  owner_avatar: string | null;
  category: ListingCategory;
  status: ListingStatus;
  title: string;
  description: string;
  media_urls: string[];
  tags: string[];
  radius_km: number | null;
  attributes: Record<string, unknown>;
  created_at: string;
}

export interface ListingCreate {
  category: ListingCategory;
  title: string;
  description: string;
  tags?: string[];
  media_urls?: string[];
  radius_km?: number | null;
  attributes?: Record<string, unknown>;
}

export interface ListingUpdate {
  title?: string;
  description?: string;
  tags?: string[];
  media_urls?: string[];
  radius_km?: number | null;
  status?: ListingStatus;
  attributes?: Record<string, unknown>;
}

export interface FeedParams {
  categories?: ListingCategory[];
  tags?: string[];
  q?: string | null;
  offset?: number;
}

export interface FeedResponse {
  data: ListingPublic[];
  next_cursor: number;
}

export interface TagPublic {
  id: string;
  name: string;
  name_de?: string | null;
  name_en?: string | null;
  name_hu?: string | null;
  is_official: boolean;
  usage_count?: number;
}

export interface TagAutocomplete {
  id: string;
  name: string;
  is_official: boolean;
}

export interface TagUpdate {
  name_de?: string | null;
  name_en?: string | null;
  name_hu?: string | null;
  is_official?: boolean;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminStatsResponse {
  total_users: number;
  active_users: number;
  verification_pending_users: number;
  total_time_volume: number;
  total_regio_volume: string;
  pending_disputes: number;
}

export interface DisputePublic {
  request_id: string;
  debtor_code: string;
  debtor_name: string;
  creditor_code: string;
  creditor_name: string;
  amount_time: number;
  amount_regio: string;
  status: PaymentRequestStatus;
  description: string | null;
  created_at: string;
}

export type DisputeAction = 'APPROVE' | 'REJECT';

export interface DisputeResolveRequest {
  action: DisputeAction;
  reason: string;
}
