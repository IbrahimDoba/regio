# Regio — Frontend

Next.js 16 frontend for the Regio community exchange platform.

---

## Getting Started

```bash
pnpm install
cp env-example .env.local   # set NEXT_PUBLIC_API_BASE_URL and Matrix vars
pnpm dev
```

App runs at http://localhost:3000.

---

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MATRIX_HOMESERVER_URL=https://matrix.151.hu
NEXT_PUBLIC_MATRIX_DOMAIN=151.hu
```

These are baked into the JS bundle at build time. In Docker they are passed as build args.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | Routing, SSR shell, layouts |
| TypeScript | Type safety across all layers |
| Tailwind CSS | Utility-first styling |
| Axios | All HTTP requests to the backend |
| TanStack Query v5 | Server state, caching, infinite scroll |
| Zustand v5 | Client state (Matrix credentials, persisted) |
| Matrix JS SDK v41 | Real-time chat |
| React Icons (fa6) | Icon set |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes
│   │   ├── page.tsx        # Feed (home)
│   │   ├── chat/           # Chat page
│   │   ├── wallet/         # Wallet & transactions
│   │   ├── profile/        # User profile
│   │   └── admin/          # Admin dashboard
│   ├── (auth)/             # Unauthenticated routes (login, register)
│   ├── terms/              # Terms page
│   └── layout.tsx          # Root layout (providers)
├── components/
│   ├── feed/               # FeedCard, FeedList, FilterPanel
│   ├── layout/             # Header, BottomNav, MobileContainer
│   ├── modals/             # CreateModal, EditModal, PreviewModal, etc.
│   └── ui/                 # Shared primitives (Dialog, etc.)
├── context/
│   ├── RealTimeContext.tsx # Matrix SDK chat context
│   ├── LanguageContext.tsx # i18n
│   └── DialogContext.tsx   # Global alert/confirm dialogs
├── lib/
│   ├── api/                # Full API layer (see below)
│   ├── feed-helpers.ts     # CATEGORY_CONFIG, price formatting
│   └── utils.ts            # cn(), misc helpers
├── locales/                # translations.json (EN), _de, _hu
└── store/
    └── matrixStore.ts      # Zustand store for Matrix credentials
```

---

## API Layer (`src/lib/api/`)

All communication with the backend goes through this layer. **No Next.js API routes are used** — all requests go directly from the browser to the FastAPI backend via Axios.

```
api/
├── client.ts       # Axios instance — auth interceptor, token refresh, paramsSerializer
├── config.ts       # Base URL from env
├── endpoints.ts    # All URL constants
├── types.ts        # TypeScript interfaces for all API shapes
├── query-keys.ts   # TanStack Query key factory
├── modules/        # Raw async functions (one file per domain)
│   ├── listings.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── banking.ts
│   └── chat.ts
└── hooks/          # React Query hooks (one file per domain)
    ├── use-listings.ts
    ├── use-auth.ts
    ├── use-users.ts
    ├── use-banking.ts
    └── use-chat.ts
```

**How it works:**

- `modules/*.ts` — plain async functions that call the API and return typed data. These can be called anywhere.
- `hooks/*.ts` — wrap modules with `useQuery` / `useInfiniteQuery` / `useMutation` for use in components.
- `client.ts` — the Axios instance handles:
  - Injecting the JWT access token (`Authorization: Bearer ...`) from `localStorage`
  - Automatic silent token refresh on 401 (calls `POST /auth/refresh-token` which uses the HttpOnly refresh cookie)
  - Array param serialization as repeated keys (`?tags=a&tags=b`) to match FastAPI's expected format

**Auth token storage:**
- Access token: `localStorage` key `regio_access_token`
- Refresh token: HttpOnly cookie (set by backend, not accessible to JS)

---

## State Management

### Server state — TanStack Query

All data fetched from the API is managed by TanStack Query. Components call hooks (`useFeed`, `useBalance`, etc.) and get back `{ data, isLoading, error }`. Cache invalidation is handled via `queryKeys` factory.

Infinite scroll on the feed uses `useInfiniteQuery` — the backend returns a `next_cursor` offset.

### Client state — Zustand

Zustand is used only for the Matrix chat credentials that need to persist across page navigations:

```
matrixStore.ts
  - matrixUserId
  - matrixAccessToken
  - matrixHomeserver
  - deviceId
```

Persisted to `localStorage` under key `matrix-storage`.

### UI state — React Context

- `LanguageContext` — current language (GB/DE/HU), translations object `t`
- `RealTimeContext` — Matrix SDK client lifecycle, room list, send/receive messages
- `DialogContext` — global `alert()` and `confirm()` for non-blocking dialogs

---

## Chat System (Matrix SDK)

Chat uses the Matrix protocol via a self-hosted homeserver at `matrix.151.hu`. The frontend uses `matrix-js-sdk` v41.

**Flow:**
1. On login, the backend silently provisions a Matrix account for the user (lazy — only on first chat interaction).
2. The frontend calls `POST /chats/matrix/token` to get Matrix credentials and stores them in Zustand.
3. `RealTimeContext` initialises the Matrix SDK client and starts syncing.
4. When a user clicks "Contact" on a listing, the frontend calls `POST /chats/rooms/inquiry` which creates (or returns an existing) Matrix room and force-joins both parties.
5. The room ID is passed to the chat page via URL params.

**Key files:**
- `src/context/RealTimeContext.tsx` — SDK client lifecycle, event listeners, `sendMessage`, `joinRoom`, `rooms` list
- `src/lib/matrixUtils.ts` — dynamic import (SSR-safe), `initializeMatrixClient`
- `src/store/matrixStore.ts` — persisted credentials

The Matrix client is dynamically imported to avoid SSR issues (`typeof window` guard).

---

## Internationalization

Translations live in `src/locales/`:
- `translations.json` — English (source of truth, TypeScript type is derived from this file)
- `translations_de.json` — German
- `translations_hu.json` — Hungarian

`LanguageContext` exposes `t` (the translations object) and `language` (current lang code). Adding a new string: add it to `translations.json` first, then the other two files.

The language preference is persisted in `localStorage`.

---

## Feed Filters

The listing feed supports server-side filtering. Filters are staged in the UI and only committed to the API when the user presses Enter or clicks the Search button.

| Filter | Mechanism |
|---|---|
| Category | Client-side toggle (instant, no API re-fetch) |
| Text search (`q`) | Staged → committed on search |
| Tags | Autocomplete from `GET /listings/tags?q=&lang=`, staged as chips → committed on search |
| Radius | Dropdown (5km / 10km / 25km / 50km / 100km / nationwide) → committed on search |

Only autocomplete-selected tags are valid — free-text tag entry is not allowed to prevent invalid tag strings reaching the backend.

---

## Components Overview

### Feed

- `FilterPanel` — unified search input (tag chips + text), radius dropdown, search button, category icon toggles
- `FeedList` — renders cards, handles client-side category filter
- `FeedCard` — expandable listing card with owner info, pricing, media thumbnails, contact/modify action

### Modals

- `CreateModal` — multi-step listing creation (category → attributes → tags/media)
- `EditModal` — same form pre-filled for editing
- `PreviewModal` — full listing view with map, edit log, contact button

### Layout

- `Header` — filter toggle, language switcher, listing count
- `BottomNav` — feed / wallet / profile / chat navigation
- `MobileContainer` — max-width wrapper (mobile-first, 480px)

---

## Known Issues and Things to Improve

**Architecture**

- Category filtering is currently client-side after a server-side fetch. If the feed grows large, categories should be passed to the API (`?categories=OFFER_SERVICE`) to reduce payload size and improve pagination accuracy.
- No Next.js API routes are used — all requests go browser → backend. This means the backend must have CORS open to the frontend origin. Proxying through Next.js API routes would remove this constraint and allow secrets to stay server-side, but adds latency.
- The `RealTimeContext` interface was designed to match the old WebSocket implementation. Some method names (e.g., `createListingRoom`) are legacy. A cleanup pass would help clarity.

**UX**

- The feed does not implement load-more / infinite scroll UI — only the first page is typically shown. The `useInfiniteQuery` setup is correct but the scroll trigger is not wired up in `FeedList`.
- The listing count shown in the Header reflects the raw API page count, not the filtered count (client-side category filter reduces it further but Header doesn't know).
- No optimistic updates on listing create/edit — the user sees a loading state while waiting for the server.

**Code Quality**

- Some components (especially modals) are large and would benefit from being split into smaller sub-components.
- `page.tsx` (feed page) handles too much — contact logic, modal state, filter state, and data fetching could be extracted into separate hooks.
- Error boundaries are not implemented. API errors surface as console logs or silent failures in some places.
- No E2E or component tests exist yet.
