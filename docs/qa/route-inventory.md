# CHAPTER ONE — Route Inventory

## Frontend Routes (Next.js App Router)

### Public Routes (No Auth Required)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing page (Hero, events, trail preview) |
| `/login` | Static | Login page |
| `/signup` | Static | Signup page |
| `/forgot-password` | Static | Forgot password |
| `/reset-password` | Static | Reset password |
| `/events` | Dynamic | Event listing |
| `/events/[id]` | Dynamic | Event detail |
| `/games` | Dynamic | Games listing |
| `/games/[slug]` | Dynamic | Game detail |
| `/gallery` | Static | Public photo gallery |
| `/leaderboard` | Static | Public leaderboard |
| `/leaderboard/live` | Dynamic | Live leaderboard |
| `/leaderboard/[game]` | Dynamic | Game leaderboard |
| `/robots.txt` | Static | Robots.txt |
| `/sitemap.xml` | Static | Sitemap |

### Protected Routes (Login Required)

| Route | Type | Role | Description |
|-------|------|------|-------------|
| `/dashboard` | Dynamic | Student | Student dashboard |
| `/dashboard/leaderboard` | Dynamic | Student | Master leaderboard |
| `/profile` | Dynamic | Student | Profile/settings |
| `/hidden-trail` | Dynamic | Student | Hidden Trail game |
| `/hidden-trail/scan/[token]` | Dynamic | Student | QR scan page |
| `/hidden-trail/leaderboard` | Dynamic | Student | Game leaderboard |
| `/hidden-trail/result` | Static | Student | Result page |
| `/hidden-trail/stats` | Static | Student | Stats page |
| `/hidden-trail/replay` | Static | Student | Replay page |
| `/hidden-trail/achievements` | Static | Student | Achievements |
| `/hidden-trail/album` | Static | Student | Photo album |

### Admin Routes (Admin Role Required)

| Route | Type | Description |
|-------|------|-------------|
| `/admin/login` | Static | Admin login |
| `/admin/hidden-trail` | Dynamic | Admin overview |
| `/admin/hidden-trail/settings` | Dynamic | Game settings |
| `/admin/hidden-trail/levels` | Dynamic | Level management |
| `/admin/hidden-trail/qr` | Dynamic | QR management |
| `/admin/hidden-trail/qr/print/[levelId]` | Dynamic | QR print page |
| `/admin/hidden-trail/participants` | Dynamic | Participant management |
| `/admin/hidden-trail/participants/[userId]` | Dynamic | Participant detail |
| `/admin/hidden-trail/photos` | Dynamic | Photo moderation |
| `/admin/hidden-trail/live` | Dynamic | Live monitor |
| `/admin/hidden-trail/analytics` | Dynamic | Analytics |
| `/admin/hidden-trail/audit` | Dynamic | Audit log |
| `/admin/hidden-trail/simulation` | Dynamic | Simulation |
| `/admin/events` | Dynamic | Event management |
| `/admin/users` | Dynamic | User management |
| `/admin/registrations` | Dynamic | Registration management |

### Dev Routes (Development Only)

| Route | Type | Description |
|-------|------|-------------|
| `/_dev/design-system` | Dynamic | Design system showcase |

## API Routes (Next.js)

| Route | Type | Description |
|-------|------|-------------|
| `/api/auth/callback` | GET | Supabase OAuth callback |
| `/api/auth/diagnostic` | GET | Auth configuration diagnostic |
| `/api/auth/logout` | POST | Sign out |
| `/api/admin/hidden-trail/overview` | GET | Admin overview data |
| `/api/admin/hidden-trail/levels` | GET | Level list |
| `/api/admin/hidden-trail/settings` | GET/POST | Game settings |
| `/api/admin/hidden-trail/settings/create` | POST | Create game |
| `/api/admin/hidden-trail/participants` | GET | Participant list |
| `/api/admin/hidden-trail/participants/[userId]` | GET | Participant detail |
| `/api/admin/hidden-trail/audit` | GET | Audit logs |
| `/api/admin/hidden-trail/live` | GET | Live monitor |
| `/api/admin/hidden-trail/levels/[id]/toggle` | POST | Toggle level |
| `/api/admin/hidden-trail/levels/[id]/regenerate` | POST | Regenerate QR |

## Backend Routes (Koa Server)

All routes are prefixed with `/api/v1`:

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/events` | GET | List events |
| `/events/featured` | GET | Featured events |
| `/events/:id` | GET | Event detail |
| `/events/:id/capacity` | GET | Event capacity |
| `/events/:id/register` | POST | Register for event |
| `/events/:id/registration` | DELETE | Cancel registration |
| `/events/:id` | PUT | Update event |
| `/events/:id` | DELETE | Delete event |
| `/dashboard` | GET | Dashboard data |
| `/games` | GET | Games list |
| `/games/running` | GET | Running games |
| `/games/:slug` | GET | Game detail |
| `/leaderboard/master` | GET | Master leaderboard |
| `/leaderboard/games/:slug` | GET | Game leaderboard |
| `/leaderboard/live` | GET | Live leaderboard |
| `/trail/state` | GET | Trail state |
| `/trail/scan/:token` | GET | QR scan |
| `/trail/answer` | POST | Answer submission |
| `/trail/stats` | GET | Trail stats |
| `/trail/replay` | GET | Replay |
| `/trail/achievements` | GET | Achievements |
| `/trail/album` | GET | Album |
| `/trail/photo` | POST | Upload photo |
| `/gallery/hidden-trail` | GET | Public gallery |
| `/admin/hidden-trail/photos` | GET | Photo moderation |
| `/admin/hidden-trail/photos/:id/approve` | POST | Approve photo |
| `/admin/hidden-trail/photos/:id/hide` | POST | Hide photo |
| `/admin/hidden-trail/photos/:id/feature` | POST | Feature photo |
| `/admin/hidden-trail/photos/:id` | DELETE | Delete photo |
| `/admin/hidden-trail/simulation` | GET | Simulation |

## Middleware Protection Map

| Route Pattern | Required | Role | Redirect on Fail |
|--------------|----------|------|-----------------|
| `/admin/*` | ✅ | admin | `/dashboard?denied=admin` |
| `/dashboard/*` | ✅ | student | `/login` |
| `/hidden-trail/*` (not `/leaderboard`) | ✅ | student | `/login` |
| `/profile/*` | ✅ | student | `/login` |
| `/leaderboard` | ✅ | student | `/login` |
| `/login`, `/signup`, `/admin/login` | ❌ | — | Redirect to dashboard |
| `/reset-password`, `/forgot-password` | ❌ | — | Accessible |
| `/api/*` | ❌ | — | Bypassed |
| `/events/*`, `/games/*`, `/gallery`, `/leaderboard` | ❌ | — | Accessible |

## Middleware Logic

1. `/_dev/*` → 404 in production, allowed in development
2. `/auth/callback` → Rewritten to `/api/auth/callback`
3. `/api/*` → Bypassed (no auth redirect)
4. All other protected routes → Check session → Check role → Redirect if unauthorized
5. Admin pages → Check `profiles.role === "admin"`
6. Student dashboard → Check `profiles.role !== "admin"` (redirect admins to admin panel)
7. Auth entry pages → Check role → Redirect to appropriate destination
