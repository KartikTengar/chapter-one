# CHAPTER ONE — Hidden Trail Event-Day Runbook

A plain-language guide for a non-technical organizer running the Hidden Trail on event day.
No SQL or terminal is required for the common operations below.

## Before the event (preparation)

1. **Login** to `/admin/login` with the admin account.
2. Open **Settings** (`/admin/hidden-trail/settings`). If it says *NO HIDDEN TRAIL CONFIGURATION*,
   click **CREATE HIDDEN TRAIL CONFIGURATION**.
3. Open **Levels** (`/admin/hidden-trail/levels`) and configure all **10 levels** (1–10):
   - Title
   - Location riddle (tells players where the next marker is)
   - Answer riddle (shown after scanning the marker)
   - Answer (hashed server-side — never shown to players)
   - Admin location (admin-only reference)
4. Open **QR** (`/admin/hidden-trail/qr`) and **Regenerate** a token for each level, then
   **download/print** each QR. Each QR opens `/hidden-trail/scan/<token>`.
   > Regenerating a token makes the previously printed QR stop working immediately.
5. Place the printed QRs physically at their locations **in sequence (QR1 … QR10)**.
6. On **Settings**, set the game status to `active` (or schedule start/end) and save.

## Readiness check

- **Settings** shows a configured game.
- **Levels** shows all 10 levels present with answers configured.
- **QR** shows an opaque token for every level.
- Test with one student account: scan QR1, solve the answer riddle, confirm score +100.

## On event day

1. Open **Live Monitor** (`/admin/hidden-trail/live`) — it shows active participants, top scores,
   and recent scans. Press **REFRESH** periodically (realtime feed is optional).
2. Open the big-screen leaderboard at `/leaderboard/live` and leave it up.
3. Students log in, open **Hidden Trail**, and follow the location riddles.
4. As markers are cleared, scores update and players climb the leaderboard.

## During the event

- **Pause** (Settings → Pause) stops new progression while preserving history — use if you need
  to pause for a talk or disruption.
- **Resume** (Settings → Resume) restores gameplay.
- Monitor **Analytics** (`/admin/hidden-trail/analytics`) for completion rate and per-level drop-off.
- **Photos** (optional): when enabled, players may capture a moment at each marker. Photos are
  optional and never affect score. If players hide a photo, it leaves the public gallery but
  remains in their own album.

## Ending the event

1. **Settings → End Game.** No further scans or answers are accepted. Historical data remains intact.
2. Confirm with the strong confirmation dialog.
3. Keep the **gallery** (if enabled) open so approved memories remain visible after the event.
4. Review **Analytics** and **Audit Log** (`/admin/hidden-trail/audit`) for a post-event summary.

## Do's and don'ts

- Do keep QRs placed in exact sequence.
- Do test one student account end-to-end before opening to everyone.
- Do regenerate a QR immediately if a printed one is misplaced (old code stops working).
- Don't reveal answer riddles or admin locations to players.
- Don't rely on photos as proof of physical presence — QR + answer is authoritative.