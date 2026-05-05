# Regio API

FastAPI backend for the Regio community exchange platform. Handles auth, listings, dual-currency banking, Matrix chat provisioning, file storage, and admin tooling.

---

## Getting Started

Requirements: Python 3.13+, PostgreSQL, Redis.

```bash
cd server
cp env-example .env        # fill in all values
uv run alembic upgrade head
uv run fastapi dev         # http://localhost:8000
```

API docs available at http://localhost:8000/docs (disabled in production).

---

## Tech Stack

| Tool | Purpose |
|---|---|
| FastAPI | Web framework, OpenAPI docs |
| SQLModel | ORM (SQLAlchemy async + Pydantic) |
| asyncpg | Async PostgreSQL driver |
| Alembic | Database migrations |
| Redis | Token blacklist, session invalidation |
| APScheduler | Cron jobs (demurrage, fees, payment enforcement) |
| aioboto3 | Cloudflare R2 (S3-compatible) file storage |
| PyJWT + pwdlib | JWT tokens + Argon2 password hashing |
| aiosmtplib | Async email sending |
| DeepSeek API | Listing translation (EN/DE/HU) |
| uv | Python package manager |

---

## Project Structure

```
app/
├── main.py             # App factory, routers, middleware, exception handlers
├── core/
│   ├── config.py       # Pydantic settings (all env vars)
│   ├── database.py     # Async engine, session factory, DB init
│   └── file_storage.py # R2 / local file storage abstraction
├── auth/               # JWT auth, token refresh, logout
├── users/              # Registration, profiles, avatars, invites
├── banking/            # Balances, transfers, payment requests, disputes
├── listings/           # Feed, CRUD, tags, media upload, translations
├── chat/               # Matrix provisioning, rooms, credentials
├── broadcast/          # Admin broadcasts, user inbox
└── admin/              # Dashboard stats, user/tag/dispute management
```

Each module follows the same pattern:
```
module/
├── models.py       # SQLModel table definitions
├── schemas.py      # Pydantic request/response schemas
├── service.py      # Business logic (receives AsyncSession)
├── routes.py       # FastAPI router (thin — delegates to service)
├── dependencies.py # Depends() factories for service injection
└── exceptions.py   # Custom exception classes
```

---

## API Endpoints

### Auth — `/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login/access-token` | Login with email + password. Returns access token in body, sets refresh token as HttpOnly cookie. |
| POST | `/auth/refresh-token` | Exchange refresh cookie for a new access token (rotates both tokens). |
| POST | `/auth/login/test-token` | Validate an access token. |
| POST | `/auth/logout` | Invalidate both tokens (adds to Redis blacklist). |

### Users — `/users`

| Method | Path | Description |
|---|---|---|
| POST | `/users/register` | Public registration. Requires a valid invite code. |
| GET | `/users/me` | Current user's profile. |
| PATCH | `/users/me` | Update mutable fields (address, language, notification prefs). Name and email are immutable. |
| PUT | `/users/me/avatar` | Upload profile picture (JPEG/PNG, max 5 MB). Stored in R2. |
| GET | `/users/{user_code}/avatar` | Serve a user's avatar. |
| GET | `/users/search?q=` | Autocomplete user search by name or code. |
| GET | `/users/invites` | Get current user's invite codes (up to 3). |
| GET | `/users/invites/request` | Void old invites, generate 3 fresh ones. |
| GET | `/users` | List all users with pagination (admin only). |
| GET | `/users/{user_code}` | Get any user by code (admin only). |

### Listings — `/listings`

| Method | Path | Description |
|---|---|---|
| GET | `/listings/feed` | Paginated listing feed. Supports `q`, `categories`, `tags`, `radius`, `offset`, `lang`. |
| GET | `/listings/tags?q=&lang=` | Tag autocomplete (up to 10 results, matched against localized names). |
| POST | `/listings` | Create a listing. Tags are auto-created if new. Translation to DE/HU runs in background. |
| GET | `/listings/{id}?lang=` | Get listing by ID. Returns localized title/description if available. |
| PATCH | `/listings/{id}` | Edit listing (owner only). |
| DELETE | `/listings/{id}` | Delete listing (owner or admin). |
| POST | `/listings/{id}/media` | Upload media files (max 10 files, max 10 MB each, JPEG/PNG/WebP/GIF/PDF). |

**Feed filter params:**

| Param | Type | Notes |
|---|---|---|
| `q` | string | Full-text search on title + description |
| `categories` | repeated string | e.g. `?categories=OFFER_SERVICE&categories=SELL_PRODUCT` |
| `tags` | repeated string | AND logic — listing must have all specified tags |
| `radius` | enum | `5km` / `10km` / `25km` / `50km` / `100km` / `nationwide` |
| `offset` | int | Cursor-based pagination |
| `lang` | string | `en` / `de` / `hu` — controls which translation is returned |

**Tag enforcement:** The backend does not validate that tag strings sent to `/feed` exist in the database. Invalid tag strings simply return no results. The frontend is responsible for only sending autocomplete-selected tags.

**Listing categories:**
`OFFER_SERVICE`, `SEARCH_SERVICE`, `SELL_PRODUCT`, `SEARCH_PRODUCT`, `OFFER_RENTAL`, `RIDE_SHARE`, `EVENT_WORKSHOP`

### Banking — `/banking`

| Method | Path | Description |
|---|---|---|
| GET | `/banking/balance` | Current balances (Time + Regio), trust level, debt limits. |
| GET | `/banking/history` | Paginated transaction history. Supports `page`, `page_size`, `days`. |
| POST | `/banking/transfer` | Direct transfer to another user (Time and/or Regio). |
| POST | `/banking/requests` | Create a payment request (invoice) to another user. |
| GET | `/banking/requests/incoming` | Pending requests where I am the debtor. |
| GET | `/banking/requests/outgoing` | Pending requests I sent as creditor. |
| POST | `/banking/requests/{id}/confirm` | Pay a request. |
| POST | `/banking/requests/{id}/reject` | Decline a request. |
| POST | `/banking/requests/{id}/cancel` | Cancel a request I sent. |
| POST | `/banking/requests/{id}/dispute` | Raise a dispute on a rejected request (goes to admin). |

**Balance rules by trust level (T1–T6):** higher trust = higher debt allowance and transaction limits. The `balance` response includes pre-calculated `limits` and `available_*` fields.

### Chat — `/chats`

| Method | Path | Description |
|---|---|---|
| POST | `/chats/matrix/register` | Explicitly register a Matrix account (usually not called directly). |
| POST | `/chats/matrix/token` | Get Matrix credentials (provisions account if not yet created). Called on login. |
| POST | `/chats/rooms/inquiry` | Create or retrieve the Matrix room for a listing inquiry. Returns `{ matrix_room_id }`. |
| GET | `/chats/rooms` | List all Matrix rooms the current user is part of. |

**Matrix provisioning:** accounts are created lazily — only when a user first tries to chat. The Matrix username is derived from the user's UUID. Passwords and access tokens are stored AES-256 encrypted in the database.

### Broadcasts — `/broadcasts`

| Method | Path | Description |
|---|---|---|
| POST | `/broadcasts/send` | Send a broadcast message (admin only). Can target specific trust levels. |
| GET | `/broadcasts/inbox` | Get current user's broadcast inbox. Supports `limit`, `offset`. |
| PATCH | `/broadcasts/{id}/read` | Mark a broadcast as read. |

### Admin — `/admin`

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Platform stats: user counts, verification queue, circulation totals, pending disputes. |
| GET | `/admin/users` | Full user list with balances. Supports `q`, `skip`, `limit`. |
| PATCH | `/admin/users/{user_code}` | Force update any user's profile, trust level, or verification status. |
| PATCH | `/admin/users/verify-user/{user_code}` | Approve a user — sets status to VERIFIED. |
| PATCH | `/admin/users/{user_code}/toggle` | Ban or unban a user. |
| GET | `/admin/tags` | List all tags. Pass `?pending=true` for unapproved tags only. |
| PATCH | `/admin/tags/{id}` | Update tag translations or approve it (`is_official: true`). |
| DELETE | `/admin/tags/{id}` | Delete a tag. |
| GET | `/admin/disputes` | List all payment requests in DISPUTED status. |
| POST | `/admin/disputes/{id}/resolve` | Resolve a dispute: `APPROVE` (transfer happens) or `REJECT`. Both parties are notified. |

---

## Authentication

JWT-based with refresh token rotation.

**Access token:**
- Short-lived (default: 5 minutes)
- Sent in `Authorization: Bearer <token>` header
- Contains `{ sub: user_id, exp }`

**Refresh token:**
- Long-lived (default: 7 days)
- Stored in an HttpOnly `refresh_token` cookie
- On each use, both tokens are rotated and the old refresh token is blacklisted in Redis

**Token blacklist:** Redis stores invalidated tokens until they expire. This covers logout and refresh rotation.

**User status checks:** `get_current_user` dependency verifies the user is both `is_active=True` and `verification_status=VERIFIED`. Use `CurrentUserAnyStatus` for endpoints that should work before verification (e.g., the verification flow itself).

**Admin check:** `CurrentAdmin` dependency additionally verifies `is_system_admin=True`.

---

## Database Models

### User
Key fields: `user_code` (e.g., "B4444"), `email`, `password_hash`, `first_name/last_name` (immutable), `trust_level` (T1–T6), `verification_status`, `is_active`, `is_system_admin`, `matrix_user_id`, `matrix_password` (AES encrypted).

### Listing
Key fields: `category`, `status`, `title_original`, `description_original`, `title_en/de/hu`, `description_en/de/hu`, `tags` (JSONB array), `media_urls` (JSON array), `radius_km`, `location_lat/lng`.

### Tag
Key fields: `name` (unique), `name_en/de/hu`, `is_official` (false = pending admin approval), `usage_count`.

### Account
One per currency per user. Key fields: `type` (REGIO or TIME), `balance_time`, `balance_regio`. Uses optimistic locking (`version`) to prevent concurrent transfer race conditions.

### Transaction
Immutable ledger entry. Key fields: `sender_id`, `receiver_id`, `amount_time`, `amount_regio`, `is_system_fee`, `payment_request_id`.

### PaymentRequest
Key fields: `creditor_id`, `debtor_id`, `amount_time`, `amount_regio`, `status` (PENDING / APPROVED / REJECTED / DISPUTED), `dispute_reason`, `admin_note`.

### MatrixRoom / MatrixRoomParticipant / MatrixUserCredentials
Track Matrix room membership and encrypted user credentials. See `chat/models.py`.

### Broadcast / UserBroadcast
Admin messages with per-user read tracking. Can be targeted by trust level.

---

## Environment Variables

Copy `env-example` to `.env` (local dev) or `.env.docker` (Docker Compose).

```env
# Core
PROJECT_NAME=regio-server
ENVIRONMENT=development         # development | staging | production
SECRET_KEY=<random 64-char string>
ALGORITHM=HS256
BACKEND_URL=http://localhost:8000

# CORS
FRONTEND_HOSTS=["http://localhost:3000"]
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
# Optional regex for wildcard subdomains:
# BACKEND_CORS_ORIGIN_REGEX=https://(.*\.)?regio\.(is|151\.hu)

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_SERVER=localhost        # use host.containers.internal inside Docker
POSTGRES_DB=regio
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Cloudflare R2 (file storage)
R2_BUCKET_NAME=
R2_ENDPOINT_URL=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# Matrix homeserver
MATRIX_HOMESERVER=https://matrix.151.hu
MATRIX_DOMAIN=151.hu
MATRIX_REGISTRATION_TOKEN=
MATRIX_ADMIN_USER=
MATRIX_ADMIN_PASSWORD=
MATRIX_ENCRYPTION_KEY=          # 32-character string, used for AES-256 encryption

# System account (treasury/sink for fees)
SYSTEM_SINK_CODE=A1000
SYSTEM_SINK_FIRST_NAME=System
SYSTEM_SINK_LAST_NAME=Account
SYSTEM_SINK_EMAIL=system@regio.is
SYSTEM_SINK_PASSWORD=
SYSTEM_INVITE_CODE=SYSTEM

# Auth token lifetimes
ACCESS_TOKEN_EXPIRE_MINUTES=5
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_ADDRESS=noreply@regio.is
SMTP_USE_TLS=true
CALENDLY_URL=                   # Verification video call booking link

# AI (listing translations)
DEEPSEEK_API_KEY=
```

---

## Migrations

Alembic is used for all schema changes.

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Create a new migration (auto-detect model changes)
uv run alembic revision --autogenerate -m "describe the change"

# Downgrade one step
uv run alembic downgrade -1
```

All models must be imported in `alembic/env.py` for autogenerate to detect them. When adding a new module, add its `models.py` import there.

---

## Scheduled Jobs (APScheduler)

Three jobs run automatically:

| Job | Schedule | Description |
|---|---|---|
| `run_payment_enforcer` | Every 1 hour | Checks and enforces overdue payment obligations |
| `run_monthly_fees` | 1st of month, 02:00 | Deducts monthly membership fees from accounts |
| `run_demurrage` | Daily, 05:00 | Applies demurrage (currency decay) to Regio balances |

These are started on app startup via the lifespan context manager in `main.py`.

---

## File Storage

Files are stored in Cloudflare R2. The storage layer (`core/file_storage.py`) is abstracted so it can fall back to local disk if R2 env vars are not set — useful for local development without cloud credentials.

Uploaded files are served via `GET /media/{key:path}` which proxies from R2 to the client. This keeps R2 credentials server-side.

PDFs are auto-compressed via GhostScript (installed in the Docker image).

---

## Known Issues and Things to Improve

- **Tag validation on feed:** The backend accepts any string for `?tags=` without checking if the tag exists. If a client sends a random string, it just returns no results silently. Adding a validation step would give clearer feedback.
- **Matrix encryption:** The AES-256-CBC implementation uses a static IV (`matrix_crypto.py`). This means identical plaintexts produce identical ciphertexts. For production use, a random IV per encryption (stored alongside the ciphertext) would be more secure.
- **No rate limiting:** There is no rate limiting on any endpoint. High-volume endpoints like `/auth/login/access-token` and `/users/register` should have rate limits added (e.g., via slowapi).
- **Background task queue:** Translations and emails are sent via FastAPI's `BackgroundTasks` which are in-process. If the server restarts mid-task, the task is lost. A proper task queue (Celery, ARQ) would be more reliable.
- **No test suite:** There are no automated tests. The service layer is well-isolated and would be straightforward to unit test.
- **Matrix admin password vs token:** The current implementation authenticates to Matrix using admin username + password each time rather than caching the admin access token, which adds latency to room creation.
