# Regio API Client Library

A comprehensive, type-safe API client for the Regio application built with **Axios** and **TanStack Query** (React Query).

## 📁 Structure

```
src/lib/api/
├── client.ts              # Axios instance with interceptors
├── config.ts              # API configuration
├── endpoints.ts           # URL constants
├── types.ts               # TypeScript types for API
├── query-keys.ts          # Query key factory
├── query-provider.tsx     # TanStack Query provider
├── modules/               # API client modules
│   ├── auth.ts           # Authentication API
│   ├── users.ts          # Users API
│   ├── banking.ts        # Banking API
│   ├── listings.ts       # Listings API
│   └── index.ts          # Module exports
├── hooks/                 # Custom React hooks
│   ├── use-auth.ts       # Auth hooks
│   ├── use-users.ts      # User hooks
│   ├── use-banking.ts    # Banking hooks
│   ├── use-listings.ts   # Listings hooks
│   └── index.ts          # Hook exports
├── index.ts               # Main entry point
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Provider Setup

The `QueryProvider` is already set up in `app/layout.tsx`:

```tsx
import { QueryProvider } from '@/lib/api';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 3. Using Hooks in Components

```tsx
'use client';

import { useLogin, useFeed, useBalance } from '@/lib/api';

export function MyComponent() {
  // Query hook (GET request)
  const { data: feed, isLoading, error } = useFeed({
    categories: ['GOODS'],
    limit: 10,
  });

  // Mutation hook (POST/PUT/DELETE request)
  const login = useLogin();

  const handleLogin = () => {
    login.mutate({
      username: 'user@example.com',
      password: 'password123',
    }, {
      onSuccess: (data) => {
        console.log('Logged in!', data);
      },
      onError: (error) => {
        console.error('Login failed', error);
      },
    });
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {feed && <p>Found {feed.total} items</p>}
    </div>
  );
}
```

## 🎯 Features

### ✅ Type Safety
- Full TypeScript support
- Type-safe API calls
- Inferred return types

### ✅ Authentication
- Automatic JWT token injection
- Token refresh on 401 errors
- HttpOnly cookie support for refresh tokens

### ✅ Error Handling
- Global error interceptors
- Automatic retry logic
- Detailed error messages

### ✅ Caching & State Management
- Automatic caching with TanStack Query
- Optimistic updates
- Cache invalidation strategies

### ✅ Developer Experience
- React Query DevTools (dev only)
- Request/response logging (dev only)
- Centralized configuration

## 📚 API Reference

### Authentication Hooks

#### `useLogin()`
Login mutation hook.

```tsx
const login = useLogin();

login.mutate({
  username: 'user@example.com',
  password: 'password123',
});
```

#### `useLogout()`
Logout mutation hook.

```tsx
const logout = useLogout();

logout.mutate();
```

#### `useCurrentUser()`
Get current authenticated user.

```tsx
const { data: user, isLoading } = useCurrentUser();
```

#### `useIsAuthenticated()`
Check authentication status.

```tsx
const { isAuthenticated, isLoading, user } = useIsAuthenticated();
```

---

### User Hooks

#### `useUser(id: string)`
Get user by ID.

```tsx
const { data: user } = useUser('user-id-123');
```

#### `useUserByCode(code: string)`
Get user by user code (e.g., "A1000").

```tsx
const { data: user } = useUserByCode('A1000');
```

#### `useRegisterUser()`
Register new user mutation.

```tsx
const register = useRegisterUser();

register.mutate({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  password: 'securepassword',
  invite_code: 'INVITE123',
});
```

#### `useUpdateUser()`
Update current user mutation.

```tsx
const updateUser = useUpdateUser();

updateUser.mutate({
  bio: 'Updated bio',
  language: 'EN',
});
```

#### `useUserInvites()`
Get user's invite codes.

```tsx
const { data: invites } = useUserInvites();
```

#### `useCreateInvite()`
Create new invite code.

```tsx
const createInvite = useCreateInvite();

createInvite.mutate({
  max_uses: 5,
  expires_at: '2024-12-31T23:59:59Z',
});
```

---

### Banking Hooks

#### `useBalance()`
Get current user's balance.

```tsx
const { data: balance } = useBalance();
// { balance_time: 120, balance_regio: "50.00" }
```

#### `useMyAccount()`
Get current user's account details.

```tsx
const { data: account } = useMyAccount();
```

#### `useTransferFunds()`
Transfer funds to another user.

```tsx
const transfer = useTransferFunds();

transfer.mutate({
  receiver_code: 'A1000',
  amount_time: 60, // 60 minutes
  amount_regio: '10.00',
  reference: 'Payment for services',
});
```

#### `useTransactions()`
Get transaction history.

```tsx
const { data: transactions } = useTransactions({
  skip: 0,
  limit: 20,
});
```

#### `usePaymentRequests()`
Get payment requests.

```tsx
const { data: requests } = usePaymentRequests();
```

#### `useCreatePaymentRequest()`
Create payment request.

```tsx
const createRequest = useCreatePaymentRequest();

createRequest.mutate({
  debtor_code: 'A1000',
  amount_time: 30,
  reference: 'Request for freelance work',
});
```

#### `useApprovePaymentRequest()` / `useRejectPaymentRequest()` / `useCancelPaymentRequest()`
Manage payment requests.

```tsx
const approve = useApprovePaymentRequest();
const reject = useRejectPaymentRequest();
const cancel = useCancelPaymentRequest();

approve.mutate('payment-request-id');
```

---

### Listings Hooks

#### `useFeed(params?)`
Get feed with filters.

```tsx
const { data: feed } = useFeed({
  categories: ['GOODS', 'SERVICES'],
  tags: ['vegan', 'local'],
  q: 'organic',
  skip: 0,
  limit: 20,
});
```

#### `useListing(id: string)`
Get listing by ID.

```tsx
const { data: listing } = useListing('listing-id-123');
```

#### `useMyListings()`
Get current user's listings.

```tsx
const { data: myListings } = useMyListings();
```

#### `useCreateListing()`
Create new listing.

```tsx
const createListing = useCreateListing();

createListing.mutate({
  category: 'GOODS',
  title: 'Organic Vegetables',
  description: 'Fresh from my garden',
  tags: ['organic', 'vegetables', 'local'],
  radius: 5,
});
```

#### `useUpdateListing()`
Update listing.

```tsx
const updateListing = useUpdateListing();

updateListing.mutate({
  id: 'listing-id',
  data: {
    title: 'Updated title',
    status: 'INACTIVE',
  },
});
```

#### `useDeleteListing()`
Delete listing.

```tsx
const deleteListing = useDeleteListing();

deleteListing.mutate('listing-id');
```

#### `useTags()`
Get all tags.

```tsx
const { data: tags } = useTags();
```

#### `useSearchTags(query: string)`
Search tags by name.

```tsx
const { data: tags } = useSearchTags('veg');
```

---

## 🔧 Direct API Calls

If you need to make API calls outside of React components (e.g., in server actions), use the API modules directly:

```tsx
import { api } from '@/lib/api';

// In a server action or utility function
const user = await api.users.getCurrentUser();
const feed = await api.listings.getFeed({ limit: 10 });
const balance = await api.banking.getBalance();
```

## 🎨 Query Keys

Query keys are centralized in `query-keys.ts` for consistent cache management:

```tsx
import { queryKeys, queryClient } from '@/lib/api';

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
queryClient.invalidateQueries({ queryKey: queryKeys.listings.feed() });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
```

## 🔐 Authentication Flow

### Login Flow
1. User submits credentials
2. `useLogin()` mutation sends request
3. Access token saved to localStorage
4. Refresh token saved as HttpOnly cookie
5. User queries automatically refetch

### Token Refresh
1. API call returns 401 Unauthorized
2. Interceptor catches error
3. Refresh token sent automatically (via cookie)
4. New access token received and saved
5. Original request retried with new token

### Logout Flow
1. `useLogout()` mutation called
2. Tokens invalidated on server
3. Local storage cleared
4. Query cache cleared
5. User redirected to `/auth`

## 📦 TypeScript Types

All types are exported from `types.ts`:

```tsx
import type {
  UserPublic,
  ListingPublic,
  TransactionPublic,
  FeedParams,
  LoginRequest,
  // ... and more
} from '@/lib/api';
```

## 🛠️ Configuration

### API Base URL
Set in `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Query Client Options
Modify in `query-provider.tsx`:
```tsx
{
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
}
```

### Axios Options
Modify in `client.ts`:
```tsx
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true,
});
```

## 🐛 Debugging

### Enable Request Logging
Requests/responses are logged in development mode automatically.

### React Query DevTools
Open DevTools in development:
- Button appears in bottom-right corner
- View all queries and their states
- Inspect cache data
- Manually trigger refetches

### Check Token
```tsx
import { getAccessToken } from '@/lib/api';

console.log('Current token:', getAccessToken());
```

## 📝 Best Practices

### 1. Use Hooks in Components
```tsx
// ✅ Good
function MyComponent() {
  const { data } = useFeed();
  return <div>{data?.total}</div>;
}

// ❌ Bad (don't call API directly in components)
function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.listings.getFeed().then(setData);
  }, []);
  return <div>{data?.total}</div>;
}
```

### 2. Handle Loading and Error States
```tsx
const { data, isLoading, error } = useFeed();

if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;
return <FeedList items={data.items} />;
```

### 3. Optimistic Updates
```tsx
const updateListing = useUpdateListing();

updateListing.mutate(data, {
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.listings.detail(id) });

    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.listings.detail(id));

    // Optimistically update
    queryClient.setQueryData(queryKeys.listings.detail(id), newData);

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.listings.detail(id), context.previous);
  },
});
```

### 4. Conditional Queries
```tsx
// Only fetch if user is authenticated
const { data: user } = useCurrentUser();
const { data: balance } = useBalance();

// Only fetch if ID exists
const { data: listing } = useListing(id, !!id);
```

## 🚀 Next Steps

1. Configure your `.env.local` with the API base URL
2. Start the backend server
3. Use hooks in your components
4. Check React Query DevTools for debugging

## 📞 Support

For issues or questions:
- Check the [main README](../../../README.md)
- Review [summary.md](../../../summary.md) for project overview
- Inspect Network tab in browser DevTools
