# CHAPTER ONE — Full Regression Matrix

## Route Inventory

| Route | Type | Auth Required | Role | Server/Client | Primary Data Source | Expected Purpose |
|-------|------|--------------|------|---------------|---------------------|-----------------|
| `/` | Static | No | — | Server | Supabase | Landing page |
| `/login` | Static | No | — | Server | Supabase | Login |
| `/signup` | Static | No | — | Server | Supabase | Signup |
| `/forgot-password` | Static | No | — | Server | Supabase | Password reset |
| `/reset-password` | Static | No | — | Server | Supabase | Password reset |
| `/dashboard` | Dynamic | Yes | Student | Client | Koa `/api/v1/dashboard` | Student dashboard |
| `/dashboard/leaderboard` | Dynamic | Yes | Student | Client | Koa `/api/v1/leaderboard/master` | Master leaderboard |
| `/events` | Dynamic | No | — | Server | Koa `/api/v1/events` | Event listing |
| `/events/[id]` | Dynamic | No | — | Server | Koa `/api/v1/events/[id]` | Event detail |
| `/games` | Dynamic | No | — | Server | Koa `/api/v1/games` | Games listing |
| `/games/[slug]` | Dynamic | No | — | Server | Koa `/api/v1/games/[slug]` | Game detail |
| `/hidden-trail` | Dynamic | Yes | Student | Client | Supabase `qr_games`, `qr_participants` | Hidden Trail game |
| `/hidden-trail/scan/[token]` | Dynamic | Yes | Student | Client | Koa `/api/v1/trail/scan/[token]` | QR scan |
| `/hidden-trail/leaderboard` | Dynamic | Yes | Student | Client | Koa `/api/v1/leaderboard/games/hidden-trail` | Game leaderboard |
| `/hidden-trail/result` | Static | Yes | Student | Client | — | Result page |
| `/hidden-trail/stats` | Static | Yes | Student | Client | Koa `/api/v1/trail/stats` | Stats page |
| `/hidden-trail/replay` | Static | Yes | Student | Client | Koa `/api/v1/trail/replay` | Replay page |
| `/hidden-trail/achievements` | Static | Yes | Student | Client | Koa `/api/v1/trail/achievements` | Achievements page |
| `/hidden-trail/album` | Static | Yes | Student | Client | Koa `/api/v1/trail/album` | Album page |
| `/gallery` | Static | No | — | Server | Koa `/api/v1/gallery/hidden-trail` | Public gallery |
| `/profile` | Dynamic | Yes | Student | Client | Koa `/api/v1/dashboard` | Profile/settings |
| `/admin/login` | Static | No | — | Server | Supabase | Admin login |
| `/admin/hidden-trail` | Dynamic | Yes | Admin | Server | Supabase | Admin overview |
| `/admin/hidden-trail/settings` | Dynamic | Yes | Admin | Server | Supabase | Game settings |
| `/admin/hidden-trail/levels` | Dynamic | Yes | Admin | Server | Supabase | Level management |
| `/admin/hidden-trail/qr` | Dynamic | Yes | Admin | Client | Koa `/api/v1/admin/hidden-trail/overview` | QR management |
| `/admin/hidden-trail/qr/print/[levelId]` | Dynamic | Yes | Admin | Server | Supabase | QR print page |
| `/admin/hidden-trail/participants` | Dynamic | Yes | Admin | Server | Supabase | Participant management |
| `/admin/hidden-trail/photos` | Dynamic | Yes | Admin | Server | Koa `/api/v1/admin/hidden-trail/photos` | Photo moderation |
| `/admin/hidden-trail/live` | Dynamic | Yes | Admin | Server | Koa `/api/v1/admin/hidden-trail/live` | Live monitor |
| `/admin/hidden-trail/analytics` | Dynamic | Yes | Admin | Server | Koa | Analytics |
| `/admin/hidden-trail/audit` | Dynamic | Yes | Admin | Server | Koa | Audit log |
| `/admin/hidden-trail/simulation` | Dynamic | Yes | Admin | Server | Koa | Simulation |
| `/admin/events` | Dynamic | Yes | Admin | Server | Koa | Event management |
| `/admin/users` | Dynamic | Yes | Admin | Server | Koa | User management |
| `/admin/registrations` | Dynamic | Yes | Admin | Server | Koa | Registration management |
| `/leaderboard` | Static | No | — | Server | Koa `/api/v1/leaderboard` | Public leaderboard |
| `/leaderboard/[game]` | Dynamic | No | — | Server | Koa `/api/v1/leaderboard/games/[slug]` | Game leaderboard |
| `/leaderboard/live` | Dynamic | No | — | Server | Koa `/api/v1/leaderboard/live` | Live leaderboard |

## API Endpoint Inventory

### Koa Backend (`/api/v1/*`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/health` | No | — | Health check |
| GET | `/api/v1/events` | No | — | Event listing |
| GET | `/api/v1/events/featured` | No | — | Featured events |
| GET | `/api/v1/events/:id` | No | — | Event detail |
| GET | `/api/v1/events/:id/capacity` | No | — | Event capacity |
| POST | `/api/v1/events/:id/register` | Yes | Student | Register for event |
| DELETE | `/api/v1/events/:id/registration` | Yes | Student | Cancel registration |
| GET | `/api/v1/dashboard` | Yes | Student | Dashboard data |
| GET | `/api/v1/games` | No | — | Games listing |
| GET | `/api/v1/games/running` | No | — | Running games |
| GET | `/api/v1/games/:slug` | No | — | Game detail |
| GET | `/api/v1/leaderboard/master` | Yes | Student | Master leaderboard |
| GET | `/api/v1/leaderboard/games/:slug` | Yes | Student | Game leaderboard |
| GET | `/api/v1/leaderboard/live` | No | — | Live leaderboard |
| GET | `/api/v1/trail/state` | Yes | Student | Trail state |
| GET | `/api/v1/trail/scan/:token` | Yes | Student | QR scan validation |
| POST | `/api/v1/trail/answer` | Yes | Student | Answer submission |
| GET | `/api/v1/trail/stats` | Yes | Student | Trail stats |
| GET | `/api/v1/trail/replay` | Yes | Student | Trail replay |
| GET | `/api/v1/trail/achievements` | Yes | Student | Achievements |
| GET | `/api/v1/trail/album` | Yes | Student | Photo album |
| POST | `/api/v1/trail/photo` | Yes | Student | Upload photo |
| GET | `/api/v1/gallery/hidden-trail` | No | — | Public gallery |
| GET | `/api/v1/admin/hidden-trail/photos` | Yes | Admin | Photo moderation queue |
| POST | `/api/v1/admin/hidden-trail/photos/:id/approve` | Yes | Admin | Approve photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/hide` | Yes | Admin | Hide photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/feature` | Yes | Admin | Feature photo |
| DELETE | `/api/v1/admin/hidden-trail/photos/:id` | Yes | Admin | Delete photo |
| GET | `/api/v1/admin/hidden-trail/simulation` | Yes | Admin | Simulation |
| GET | `/api/v1/auth/callback` | No | — | Auth callback |
| GET | `/api/v1/auth/diagnostic` | No | — | Auth diagnostic |
| POST | `/api/v1/auth/logout` | Yes | Student | Logout |

### Next.js API Routes (`/api/admin/hidden-trail/*`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/admin/hidden-trail/overview` | Yes | Admin | Admin overview |
| GET | `/api/admin/hidden-trail/levels` | Yes | Admin | Level list |
| GET | `/api/admin/hidden-trail/settings` | Yes | Admin | Game settings |
| POST | `/api/admin/hidden-trail/settings` | Yes | Admin | Update settings |
| POST | `/api/admin/hidden-trail/settings/create` | Yes | Admin | Create game |
| GET | `/api/admin/hidden-trail/participants` | Yes | Admin | Participant list |
| GET | `/api/admin/hidden-trail/participants/:userId` | Yes | Admin | Participant detail |
| GET | `/api/admin/hidden-trail/audit` | Yes | Admin | Audit logs |
| GET | `/api/admin/hidden-trail/live` | Yes | Admin | Live monitor |
| POST | `/api/admin/hidden-trail/levels/:id/toggle` | Yes | Admin | Toggle level |
| POST | `/api/admin/hidden-trail/levels/:id/regenerate` | Yes | Admin | Regenerate QR |

## Regression Fixes Applied

| ID | Area | Symptom | Root Cause | Fix | Status |
|----|------|---------|------------|-----|--------|
| R01 | Hidden Trail | "Trail Not Found" for new users | `getParticipantStatus()` returns `null` when no participant record exists | Added `if (!data) return default not_started status` check | FIXED |
| R02 | Hidden Trail | `var(--mixed)` CSS variable not defined | `TrailProgress.tsx` used non-existent CSS variable | Changed `var(--mixed)` to `var(--muted)` | FIXED |
| R03 | Admin QR Management | Admin shell/styles missing | `_admin.scss` lacked `.chapter-admin-*` CSS classes | Added comprehensive admin shell CSS classes | FIXED |
| R04 | Admin QR Management | `var(--chapter-*)` CSS custom properties not defined | `_admin.scss` referenced non-existent CSS custom properties | Replaced with existing CSS custom properties (`var(--border)`, `var(--accent)`, etc.) | FIXED |
| R05 | Admin QR Management | Duplicate `.chapter-admin-btn` definitions | `_admin.scss` had duplicate button class definitions | Removed duplicate, consolidated into single definition | FIXED |

| R06 | Global CSS | `text-rendering: optimizeLegibility` invalid CSS value | Invalid CSS declaration could cause browser to ignore body styles | Fixed to `optimize-legibility` | FIXED |
| R07 | QrPrintView | Unused `mounted` state | `useState(true)` defined but never used | Removed `mounted` state and `useState` import | FIXED |
| R08 | TrailHero/TrailProgress | Missing `aria-hidden` on decorative Image | Accessibility issue | Added `aria-hidden="true"` to `Image` components | FIXED |

## Build Verification

| Check | Status |
|-------|--------|
| Frontend Build | PASS |
| Backend Build | PASS |
| TypeScript Check | PASS (0 errors) |
| Lint | PASS (0 errors, 42 warnings) |
| Dev Server | Running on port 3000 |
| Backend Server | Running on port 3001 |
| Health Check | PASS (200 OK) |
| Admin API | PASS (401 without auth) |
| Games API | PASS (200 OK) |
| Leaderboard API | PASS (200 OK) |

## Known Non-Critical Issues

1. **Bootstrap Sass deprecation warnings** — Bootstrap 5.3.8 uses deprecated Sass functions (`blue()`, `red()`, `green()`, `if()` syntax). These are warnings, not errors. No action required unless upgrading Bootstrap.
2. **`unused-vars` warnings** — 42 TypeScript warnings exist but are all warnings, not errors. They do not affect runtime behavior (e.g., `'userId' is defined but never used` in `game.ts`).
3. **Backend `dist/` vs `src/` sync** — Backend is running from source via `tsx`. Source changes are automatically picked up.

## Verification Notes

- The CSS was recompiled after fixing `_base.scss` (`optimize-legibility`) and manually updating the admin CSS module.
- The admin CSS module (`src_styles__admin_scss_09yx8_e.css`) was manually updated to replace `var(--chapter-*)` with correct CSS variables. When the dev server properly recompiles, the source `_admin.scss` will produce correct output.
- The `StyledJsxRegistry` in `layout.tsx` properly wraps children and styled-jsx is generating scoped styles correctly.
- The `color-scheme: dark` on `:root` is properly set and CSS custom properties are emitted correctly.
