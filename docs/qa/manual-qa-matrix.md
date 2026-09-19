# CHAPTER ONE — Manual QA Matrix

Environment used for this verification:

- Frontend: `npm run dev` at `http://localhost:3000` (Next.js dev server)
- Backend: Koa at `http://localhost:3001` (`node dist/index.js`)
- Database: Supabase project `csnhvvbezzbpmhqgxrhr` (migrations phase 6–12 applied)
- Browser: Playwright headless Chromium 153
- Viewports: 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920; live: 1366x768, 1920x1080, 3840x2160
- Roles: anonymous, student (3 QA accounts), admin (`admin@chapterone.local`)

## Results (summary)

| Area | Result |
|------|--------|
| Public routes render | PASS (all HTTP 200, no overflow) |
| Anonymous → protected redirects | PASS |
| Student login / dashboard | PASS |
| Hidden Trail scan → answer challenge | PASS |
| Wrong QR (wrong trail) | PASS (no clue/score leakage) |
| Wrong answer retry | PASS (inline, page not lost) |
| Correct answer + scoring | PASS (position 1 = 100, position 2 = 98) |
| Duplicate / already-cleared | PASS (no additional score) |
| Photo upload / storage / moderation / gallery | PASS |
| Photo IDOR | PASS (cross-user delete → 403) |
| Stats / replay / achievements / album / result | PASS |
| Public gallery | PASS |
| Live leaderboard (1366/1920/3840) | PASS |
| Admin routes (11 sections) | PASS |
| Student → admin blocked | PASS (redirect + 403 API) |
| Concurrency (parallel answers) | PASS (unique positions) |
| Role escalation | PASS (signup metadata cannot set admin) |
| Console errors | PASS (none critical; only intentional 400 on wrong-answer test) |

See `screenshot-index.md` for screenshot paths and `bug-log.md` for the defects
found and fixed during this pass.