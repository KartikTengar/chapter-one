# Hidden Trail — API Contract

All routes are prefixed under the Koa backend. Mutations require an authenticated JWT
(`Authorization: Bearer <token>`). Admin routes additionally require a `profiles.role = 'admin'`.

Structured errors:

```json
{ "error": { "code": "WRONG_TRAIL", "message": "This marker is not part of your current path." } }
```

## Core game rules (server-authoritative)

- 10 sequential markers. No skipping. No teams. No hints.
- Scanner position is allocated only after a **correct answer**, atomically in the database.
- Scoring: `points = max(score_floor, starting_score - n(n-1))` where `n` = successful position.
  Default `starting_score = 100`, `score_floor = 30`.
- Duplicate completion of a level is blocked (DB unique constraint).
- The canonical answer and its hash are **never** returned to players.

## Implemented endpoints (verified live)

### Student

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/api/v1/trail/state` | user | IMPLEMENTED |
| GET | `/api/v1/trail/scan/:token` | user | IMPLEMENTED |
| POST | `/api/v1/trail/answer` | user | IMPLEMENTED |
| GET | `/api/v1/trail/stats` | user | IMPLEMENTED |
| GET | `/api/v1/trail/replay` | user | IMPLEMENTED |
| GET | `/api/v1/trail/achievements` | user | IMPLEMENTED |
| GET | `/api/v1/trail/album` | user | IMPLEMENTED |
| POST | `/api/v1/trail/photo` | user (multipart) | IMPLEMENTED |
| PATCH | `/api/v1/trail/photo/:id` | user | IMPLEMENTED |
| DELETE | `/api/v1/trail/photo/:id` | user | IMPLEMENTED |

### Public

| Method | Path | Status |
|--------|------|--------|
| GET | `/api/v1/gallery/hidden-trail` | IMPLEMENTED (approved only) |
| GET | `/api/v1/leaderboard/live` | IMPLEMENTED (sanitized) |

### Admin (role checked server-side via profiles)

| Method | Path | Status |
|--------|------|--------|
| GET | `/api/v1/admin/hidden-trail/photos` | IMPLEMENTED |
| POST | `/api/v1/admin/hidden-trail/photos/:id/approve` | IMPLEMENTED |
| POST | `/api/v1/admin/hidden-trail/photos/:id/hide` | IMPLEMENTED |
| POST | `/api/v1/admin/hidden-trail/photos/:id/feature` | IMPLEMENTED |
| DELETE | `/api/v1/admin/hidden-trail/photos/:id` | IMPLEMENTED |
| GET | `/api/v1/admin/hidden-trail/simulation` | IMPLEMENTED (pure, no writes) |

The generic leaderboard endpoints (`/leaderboard/master`, `/leaderboard/games/:slug`) are also implemented.

### Leaderboard

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/leaderboard/games/hidden-trail` | Game leaderboard |
| GET | `/api/v1/leaderboard/master` | Master leaderboard |
| GET | `/api/v1/leaderboard/live` | Public live (sanitized) leaderboard |

### Admin (all require admin role)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/hidden-trail/overview` | Overview KPIs + level stats |
| GET/POST | `/api/v1/admin/hidden-trail/settings` | Read / update configuration |
| GET/POST | `/api/v1/admin/hidden-trail/levels` | List / create levels |
| PATCH/DELETE | `/api/v1/admin/hidden-trail/levels/:id` | Update / delete level |
| GET | `/api/v1/admin/hidden-trail/qr` | QR/token overview |
| POST | `/api/v1/admin/hidden-trail/qr/:levelId/regenerate` | Regenerate token |
| POST | `/api/v1/admin/hidden-trail/qr/:levelId/activate` | Activate level QR |
| POST | `/api/v1/admin/hidden-trail/qr/:levelId/deactivate` | Deactivate level QR |
| GET | `/api/v1/admin/hidden-trail/participants` | Participants (paginated/searchable) |
| GET | `/api/v1/admin/hidden-trail/participants/:userId` | Participant detail |
| POST | `/api/v1/admin/hidden-trail/participants/:userId/reset` | Reset participant progress |
| POST | `/api/v1/admin/hidden-trail/participants/:userId/score-adjust` | Manual score adjustment (reason required) |
| GET | `/api/v1/admin/hidden-trail/live` | Live monitor snapshot |
| GET | `/api/v1/admin/hidden-trail/analytics` | Analytics |
| GET | `/api/v1/admin/hidden-trail/audit` | Audit log |
| GET | `/api/v1/admin/hidden-trail/simulation` | Simulation (test-only, no writes) |
| POST | `/api/v1/admin/hidden-trail/photos/:id/approve` | Approve photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/hide` | Hide photo |
| POST | `/api/v1/admin/hidden-trail/photos/:id/feature` | Feature photo |
| DELETE | `/api/v1/admin/hidden-trail/photos/:id` | Delete photo |

## Live display

The public live response contains only sanitized fields: `display_name`, `rank`, `score`,
safe marker number, `occurred_at`. It never includes email, user id, token, answer,
answer hash, admin location, private photo, or storage path.

## Security notes

- Never trust `user_id` / `game_id` / `points` / `current_level` from the client.
- Game lookup is by canonical slug `hidden-trail`, never a hard-coded UUID.
- The service-role key exists only in the Koa server environment.