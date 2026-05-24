# HuskyMingle — Web Platform

> Full-stack social networking platform for Northeastern University students. Next.js 15 · NestJS 10 · PostgreSQL · Redis · Socket.io

[![CI](https://github.com/Kaustubha-09/HuskyMingle-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Kaustubha-09/HuskyMingle-web/actions)
[![Next.js](https://img.shields.io/badge/Web-Next.js%2015-black)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/API-NestJS%2010-red)](https://nestjs.com)
[![Postgres](https://img.shields.io/badge/DB-PostgreSQL%2016-336791)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Orchestration-Docker_Compose-2496ED)](https://docs.docker.com/compose/)

---

## What Is This?

HuskyMingle-web is the full-stack web layer of HuskyMingle — a campus super-app that consolidates 20 social-networking surfaces behind a single verified `.edu` identity. The backend serves all three clients (web, Android, iOS). This repo contains the Next.js frontend and the NestJS API.

Native mobile clients live in sibling repos: [`HuskyMingle-android`](https://github.com/Kaustubha-09/HuskyMingle-android) · [`HuskyMingle-ios`](https://github.com/Kaustubha-09/HuskyMingle-ios)

---

## Features

### Authentication
- Email registration + 6-digit OTP verification
- JWT access token (15m) + refresh token rotation
- Axios interceptor silently refreshes expired tokens and retries the original request
- Zustand store persisted to `localStorage`; SSR-safe via `getState()` in `useEffect`

### Social Feed
- Cursor-based paginated feed with posts from followed users + public content
- Optimistic like/unlike with automatic revert on network failure
- Hashtag extraction, media grids (up to 4 images), embedded polls
- Real-time new-post events via Socket.io

### Real-Time Messaging
- Socket.io client — lazy singleton, `autoConnect: false`, JWT-authenticated via `authenticate` event
- Conversations list + chat view, read receipts, typing indicators
- AI-powered per-message translation (GPT-4o-mini → Google Translate → mock fallback)

### Explore & Matching
- Server-scored match cards based on shared interests, major, and university
- Follow/unfollow with optimistic updates
- Full user search by name, major, university

### Communities
- Create and join communities; member count tracking
- Community-scoped feed visible only to members
- Admin / member role distinction

### Circles (Private Groups)
- Discord-style private circles, persisted locally via Zustand + `localStorage`
- Emoji badge picker, comma-separated handle input, deep-linked detail pages
- Add/remove members; group chat integration ready (backend `Conversation` model supports it)

### Gamification
- Points system: Bronze → Silver → Gold → Platinum tiers with animated progress bar
- Achievement unlock history with timestamps
- Community leaderboard (top 10 on campus)

### Other Surfaces
- Events — RSVP, location, date, virtual/in-person flag
- Jobs & Internships — company, salary, apply link
- Marketplace — peer-to-peer listings with search
- Courses — 50 real NEU courses, enrollment tracking, progress
- Polls — real-time vote percentages
- Q&A — threaded answers with voting
- Audio Rooms, Reels, Live Streams
- Notifications, Bookmarks, Search, Settings
- Full dark-mode support via Tailwind `dark:` strategy

---

## Architecture

```
HuskyMingle-web/
├── web-app/                        # Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login · Register · Verify · Onboarding
│   │   │   └── (main)/             # 20 authenticated feature routes
│   │   │       ├── layout.tsx      # Auth guard + socket connect
│   │   │       ├── page.tsx        # Feed (home)
│   │   │       ├── explore/        # Matching + search
│   │   │       ├── messages/       # Conversations + chat
│   │   │       ├── communities/    # Groups
│   │   │       ├── circles/        # Private groups
│   │   │       ├── events/ · jobs/ · marketplace/
│   │   │       ├── courses/ · polls/ · qa/
│   │   │       ├── gaming/ · reels/ · live/ · audio/
│   │   │       ├── notifications/ · bookmarks/ · search/ · settings/
│   │   │       └── profile/[username]/
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx  # Fixed left sidebar, 20 nav items
│   │   │   └── posts/PostCard.tsx  # Typed with Post interface
│   │   ├── store/
│   │   │   ├── auth.store.ts       # Zustand + persist middleware
│   │   │   └── circles.store.ts    # Zustand + persist (client-only)
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios · JWT attach · 401 refresh
│   │   │   └── socket.ts           # Socket.io lazy singleton
│   │   └── types/
│   │       └── post.ts             # Shared Post / PostAuthor interfaces
│   └── Dockerfile
│
└── backend/                        # NestJS 10
    ├── src/
    │   ├── modules/                # 24 feature modules
    │   │   ├── auth/               # JWT strategy, refresh, OTP
    │   │   ├── posts/              # Feed, reactions, comments, pagination
    │   │   ├── messages/           # Conversations, translation pipeline
    │   │   ├── communities/        # Groups, membership, admin roles
    │   │   ├── matching/           # Score-based explore algorithm
    │   │   ├── gaming/             # Points, achievements, leaderboard
    │   │   └── ... (18 more)
    │   └── common/
    │       ├── guards/             # JwtAuthGuard, RolesGuard
    │       └── decorators/         # @CurrentUser, @Public
    └── prisma/
        └── schema.prisma           # 40+ models, 12 enums
```

### State Management

```
Server state     React Query     (cache · background refetch · pagination)
Client/auth      Zustand         (persist to localStorage · SSR-safe)
Real-time        Socket.io       (authenticated · lazy connect)
Forms            React useState  (co-located, no global form store)
```

### Request Lifecycle

```
Component → React Query → Axios (api.ts)
                               │
                    attach JWT ← localStorage
                               │
                    NestJS (JwtAuthGuard → handler)
                               │
              401 → auto-refresh → retry original request
              403 → redirect /login
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Client state | Zustand | 5 |
| Server state | TanStack Query | 5 |
| HTTP client | Axios (interceptors) | 1.7 |
| Real-time | Socket.io | 4 |
| Icons | Lucide React | latest |
| API framework | NestJS | 10 |
| ORM | Prisma | 5 |
| Database | PostgreSQL | 16 |
| Cache / pub-sub | Redis | 7 |
| Auth | Passport.js + JWT | — |
| Containerization | Docker Compose | — |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop

### 1. Clone

```bash
git clone https://github.com/Kaustubha-09/HuskyMingle-web
cd HuskyMingle-web
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > web-app/.env.local
```

### 3. Start infrastructure

```bash
docker-compose up -d      # PostgreSQL 16 + Redis 7
```

### 4. Database

```bash
cd backend && npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts   # ~20 users, posts, communities, NEU courses
```

### 5. Run

```bash
# Terminal 1
cd backend && npm run start:dev    # → localhost:3001

# Terminal 2
cd web-app && npm install && npm run dev   # → localhost:3000
```

Swagger UI: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Demo Credentials

```
Email:    alex@northeastern.edu
Password: Password123!
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `JWT_EXPIRES_IN` | Access token TTL (default `15m`) |
| `OPENAI_API_KEY` | Translation pipeline (falls back to Google → mock) |

---

## API Reference

Full Swagger at `http://localhost:3001/api/docs`. Key endpoints:

```
POST  /auth/register          POST  /auth/login           GET   /auth/me
GET   /posts/feed             POST  /posts                POST  /posts/:id/react
GET   /messages/conversations POST  /messages/conversations
GET   /messages/:id/messages  POST  /messages/:id/send
GET   /matching/recommendations
GET   /communities            POST  /communities/:id/join
GET   /marketplace            GET   /events               GET   /jobs
GET   /gaming                 GET   /courses              GET   /notifications
```

### Socket.io Events

```
→ authenticate    { userId }
→ join_room       { conversationId }
→ send_message    { conversationId, content, senderId }
→ typing          { conversationId, userId, isTyping }

← new_message    ← typing    ← read_receipt
← user_online    ← user_offline    ← notification
```

---

## Project Statistics

| Metric | Value |
|---|---|
| Authenticated routes | 20 |
| Backend modules | 24 |
| Prisma models | 40+ |
| API endpoints | 80+ |
| TypeScript source files | 60+ |
| Lines of code (approx) | ~8,500 |

---

## Tradeoffs & Design Decisions

**Why separate NestJS + Next.js instead of Next.js API routes?**
The NestJS backend serves all three clients (web, Android, iOS) without modification. Next.js API routes would only be reachable from the web client, coupling the server layer to the web framework.

**Why Zustand over Redux?**
HuskyMingle's client state is thin — auth, circles, and a few UI flags. Zustand provides the same persistence and subscription patterns with far less boilerplate. React Query handles server state; Zustand only touches what React Query can't.

**Why `window.location.href` on login instead of `router.push()`?**
The `(main)/layout.tsx` auth guard reads Zustand state after hydration. A `router.push()` doesn't force a full lifecycle, so the hydration check can fire before `localStorage` is read. A full page reload guarantees Zustand hydrates before the layout guard runs.

**Why cursor-based pagination over offset?**
Offset pagination drifts when new posts are inserted between pages. Cursor pagination (`createdAt + id`) is stable under concurrent writes — important for a social feed where the content changes every second.

---

## Roadmap

- [ ] Playwright end-to-end tests
- [ ] Jest unit tests (React Testing Library)
- [ ] Image upload via presigned S3 URLs
- [ ] Push notifications (Web Push API)
- [ ] Vercel + Railway deployment configuration
- [ ] Sentry error tracking integration
- [ ] Infinite scroll with cursor pagination (backend wired, frontend pending)

---

## Resume Bullets

- Built a full-stack campus social network with **Next.js 15 App Router**, **NestJS 10**, **PostgreSQL**, and **Redis**, covering 20 authenticated feature surfaces
- Implemented JWT access-token refresh with Axios interceptors — silently rotates tokens and retries the original request, with no user-facing interruption
- Designed a **Socket.io** real-time layer with Redis pub/sub adapter, supporting chat, presence, and notifications across horizontally-scalable backend instances
- Architected **Zustand + React Query** separation: server cache in React Query, auth/UI state in Zustand with `localStorage` persistence and SSR-safe hydration

---

## Interview Talking Points

**Auth hydration across page loads** — The main layout calls `getState().user` (not the reactive hook) inside `useEffect` to read Zustand state after `localStorage` has hydrated, avoiding a flash-to-login on every navigation.

**Scaling Socket.io** — The Redis adapter is already wired. Horizontal scaling is one load-balancer config away. The next step is a BullMQ queue on Redis to decouple message delivery from the HTTP request cycle.

**Cursor pagination vs. offset** — Cursor pagination is stable under concurrent inserts (social feeds write constantly). Offset shifts as new rows are added, causing duplicates or gaps in page N+1.

**Three-tier translation** — GPT-4o-mini for quality, Google Translate for fallback, mock for offline/CI. Each tier has the same interface; switching is a config change, not a code change.

---

*Part of the [HuskyMingle](https://github.com/Kaustubha-09/HuskyMingle) cross-platform project · Built by Kaustubha Eluri*
