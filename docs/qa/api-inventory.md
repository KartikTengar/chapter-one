# CHAPTER ONE — API Inventory

## Backend Koa API (`/api/v1/*`)

### Authentication

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/auth/callback` | No | — | OAuth callback (rewrites to Next.js) |
| GET | `/api/v1/auth/diagnostic` | No | — | Auth configuration diagnostic |
| POST | `/api/v1/auth/logout` | Yes | Student | Sign out |

### Events

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/events` | No | — | List events with filtering/pagination |
| GET | `/api/v1/events/featured` | No | — | Featured upcoming events |
| GET | `/api/v1/events/:id` | No | — | Event detail |
| GET | `/api/v1/events/:id/capacity` | No | — | Registration count |
| POST | `/api/v1/events/:id/register` | Yes | Student | Register for event |
| DELETE | `/api/v1/events/:id/registration` | Yes | Student | Cancel registration |
| POST | `/api/v1/events` | Yes | Admin | Create event |
| PUT | `/api/v1/events/:id` | Yes | Admin | Update event |
| DELETE | `/api/v1/events/:id` | Yes | Admin | Delete event |

### Dashboard

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/dashboard` | Yes | Student | User dashboard data |

### Games

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/games` | No | — | List visible games |
| GET | `/api/v1/games/running` | No | — | List running games |
| GET | `/api/v1/games/:slug` | No | — | Game detail by slug |

### Leaderboard

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/leaderboard/master` | Yes | Student | Master leaderboard |
| GET | `/api/v1/leaderboard/games/:slug` | Yes | Student | Game-specific leaderboard |
| GET | `/api/v1/leaderboard/live` | No | — | Public live leaderboard |

### Trail (Hidden Trail)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/trail/state` | Yes | Student | Game state + participant status |
| GET | `/api/v1/trail/scan/:token` | Yes | Student | Validate QR token |
| POST | `/api/v1/trail/answer` | Yes | Student | Submit answer |
| GET | `/api/v1/trail/stats` | Yes | Student | Participant stats |
| GET | `/api/v1/trail/replay` | Yes | Student | Replay timeline |
| GET | `/api/v1/trail/achievements` | Yes | Student | Achievements |
| GET | `/api/v1/trail/album` | Yes | Student | Photo album |
| POST | `/api/v1/trail/photo` | Yes | Student | Upload photo |

### Gallery

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/gallery/hidden-trail` | No | — | Public gallery |

### Admin (Hidden Trail)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/admin/hidden-trail/photos` | Yes | Admin | Photo moderation queue |
| POST | `/api/v1/admin/hidden-trail/photos/:id/approve` | Yes | Admin | Approve photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/hide` | Yes | Admin | Hide photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/feature` | Yes | Admin | Feature photo |
| DELETE | `/api/v1/admin/hidden-trail/photos/:id` | Yes | Admin | Delete photo |
| GET | `/api/v1/admin/hidden-trail/simulation` | Yes | Admin | Simulation data |

## Next.js API Routes (`/api/admin/hidden-trail/*`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/admin/hidden-trail/overview` | Yes | Admin | Game overview dashboard |
| GET | `/api/admin/hidden-trail/levels` | Yes | Admin | List all levels |
| GET | `/api/admin/hidden-trail/settings` | Yes | Admin | Game settings |
| POST | `/api/admin/hidden-trail/settings` | Yes | Admin | Update game settings |
| POST | `/api/admin/hidden-trail/settings/create` | Yes | Admin | Create new game |
| GET | `/api/admin/hidden-trail/participants` | Yes | Admin | List participants |
| GET | `/api/admin/hidden-trail/participants/:userId` | Yes | Admin | Participant detail |
| GET | `/api/admin/hidden-trail/audit` | Yes | Admin | Audit logs |
| GET | `/api/admin/hidden-trail/live` | Yes | Admin | Live monitor |
| POST | `/api/admin/hidden-trail/levels/:id/toggle` | Yes | Admin | Toggle level active |
| POST | `/api/admin/hidden-trail/levels/:id/regenerate` | Yes | Admin | Regenerate QR token |

## Next.js Auth API Routes

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/auth/callback` | No | — | Supabase auth callback |
| GET | `/api/auth/diagnostic` | No | — | Auth config diagnostic |
| POST | `/api/auth/logout` | Yes | Student | Sign out |

## Middleware-Protected Routes

| Route Pattern | Protection | Redirect |
|--------------|-----------|----------|
| `/admin/*` | Requires admin role | → `/dashboard?denied=admin` |
| `/dashboard/*` | Requires login | → `/login` |
| `/hidden-trail/*` (except `/leaderboard`) | Requires login | → `/login` |
| `/profile/*` | Requires login | → `/login` |
| `/login`, `/signup`, `/admin/login` | Auth entry | Redirects authenticated users |
| `/reset-password`, `/forgot-password` | Recovery | Accessible |
| `/api/*` | API routes | Bypassed (no redirect) |
| `/_dev/*` | Dev routes | Production: 404 |

## Middleware Configuration

```typescript
// src/middleware.ts
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```

Key behaviors:
- `/auth/callback` is rewritten to `/api/auth/callback`
- `/api/*` paths bypass auth redirect
- Admin pages redirect non-admins to `/dashboard?denied=admin`
- Student dashboards redirect admins to `/admin/hidden-trail`
- Auth entry pages redirect authenticated users based on role
