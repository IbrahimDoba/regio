# Regio

A community exchange platform built around two currencies: **Regio** (local currency) and **Time Credits** (hour-based). Users can post listings for goods, services, rentals, and events, then transact directly with each other through a built-in chat and payment system.

---

## Monorepo Structure

```
Regio/
├── regio/          # Next.js 16 frontend
├── server/         # FastAPI backend
└── docker-compose.yml
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| State / Data | Zustand v5, TanStack Query v5 |
| Chat | Matrix JS SDK v41 (via matrix.151.hu homeserver) |
| Backend | FastAPI, Python 3.13, SQLModel (SQLAlchemy async) |
| Database | PostgreSQL + Alembic migrations |
| Cache | Redis (token blacklist, sessions) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Auth | JWT (access + refresh token rotation), Argon2 passwords |
| Scheduling | APScheduler (demurrage, monthly fees, payment enforcement) |

---

## Running with Docker Compose

This is the recommended way to run everything together.

**1. Create a root `.env` file** with the two frontend build args:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:2323
NEXT_PUBLIC_MATRIX_HOMESERVER_URL=https://matrix.151.hu
NEXT_PUBLIC_MATRIX_DOMAIN=151.hu
```

**2. Create `server/.env.docker`** — copy from `server/env-example` and fill in all values (database, Redis, R2, Matrix, SMTP, etc.).

**3. Start everything:**

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3838
- API: http://localhost:2323
- API docs: http://localhost:2323/docs (dev only)

The `migrate` service runs `alembic upgrade head` automatically before the API starts.

---

## Running Locally (Development)

### Backend

Requirements: Python 3.13+, PostgreSQL running, Redis running.

```bash
cd server
cp env-example .env      # fill in values
uv run alembic upgrade head
uv run fastapi dev       # http://localhost:8000
```

### Frontend

Requirements: Node.js, pnpm.

```bash
cd regio
cp env-example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
pnpm install
pnpm dev                    # http://localhost:3000
```

---

## Platform Features

- **Listings feed** — filterable by category, tags, radius, and text search
- **Dual-currency wallet** — send/receive Time Credits and Regio, request payments, dispute resolution
- **Real-time chat** — Matrix-based, rooms created per listing inquiry
- **Identity verification** — multi-step trust level system (T1–T6)
- **Invite system** — growth via unique invite codes
- **Broadcasts** — admin messages to targeted trust level groups
- **Multilingual** — English, German, Hungarian (frontend + listing content)
- **Admin dashboard** — user management, tag moderation, dispute resolution

---

## Deployment Notes

- The API runs on port `2323` and is only bound to `127.0.0.1` in docker-compose (put Nginx in front).
- Frontend build args (`NEXT_PUBLIC_*`) are baked into the JS bundle at build time — they must be set before `docker compose build`.
- R2 credentials are required for file uploads. The API will fall back to local disk if R2 is not configured, but this is not suitable for production.
- OpenAPI docs (`/docs`) are disabled when `ENVIRONMENT=production`.
