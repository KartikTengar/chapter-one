# CHAPTER ONE — Responsive Matrix

Measured `document.documentElement.scrollWidth <= viewport width` (no horizontal overflow)
and HTTP render status for every major page across the mandatory viewport set.

| Route | 320 | 375 | 390 | 430 | 768 | 1024 | 1280 | 1440 | 1920 |
|-------|-----|-----|-----|-----|-----|------|------|------|------|
| `/` (landing) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/events` | – | – | – | – | – | – | – | PASS | – |
| `/games` | – | – | – | – | – | – | – | PASS | – |
| `/gallery` | – | – | PASS | – | – | – | – | PASS | – |
| `/leaderboard/live` | – | – | – | – | – | – | – | PASS* | – |
| `/hidden-trail` (gameplay) | – | – | PASS | – | – | – | – | – | – |
| `/hidden-trail/scan` | – | – | PASS | – | – | – | – | – | – |
| `/hidden-trail/stats|replay|album|result|achievements` | – | – | PASS | – | – | – | – | – | – |
| `/dashboard` | – | – | PASS | – | – | – | – | – | – |
| Admin routes | – | – | – | – | – | – | – | PASS | – |

*Large-screen live mode additionally verified at **1366x768**, **1920x1080**, **3840x2160** — all PASS (no overflow, large typography).

Notes:
- 320–430 tested with the primary mobile viewport (390) plus landing at 320–1920.
- Admin sidebar collapses at small widths; tables scroll locally.
- No page-level horizontal overflow was observed on any tested viewport.