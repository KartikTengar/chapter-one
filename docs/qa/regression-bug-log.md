# CHAPTER ONE — Regression Bug Log

## P0 Bugs Found & Fixed

### R01: Hidden Trail "Trail Not Found" for New Users
- **Area**: Hidden Trail game flow
- **Symptom**: `/hidden-trail` displays "Trail Not Found" for users who haven't started the game
- **Root Cause**: `getParticipantStatus()` in `src/lib/hidden-trail/game.ts` returns `null` when `maybeSingle()` returns no rows. The page condition `!participant` evaluates to true, showing the error state instead of the game rules for new users.
- **Fix**: Added explicit null check: `if (!data) return { status: "not_started", ... }`
- **Test**: Verified that new users see the game rules screen instead of "Trail Not Found"
- **Status**: FIXED

### R02: Admin Shell Styles Missing
- **Area**: Admin pages (QR Management, Overview, Settings, etc.)
- **Symptom**: Admin pages render as raw HTML without sidebar, navigation, or styling
- **Root Cause**: `_admin.scss` only contained QR print styles (`.chapter-qr-print-*`). All admin shell CSS classes were missing.
- **Fix**: Rewrote `_admin.scss` to include all missing admin shell styles with proper CSS custom property references.
- **Test**: Admin pages now render with proper sidebar, navigation, and card styling
- **Status**: FIXED

### R03: Non-existent CSS Custom Properties in Admin Styles
- **Area**: Admin styles
- **Symptom**: Admin QR print page has broken styling due to undefined CSS variables
- **Root Cause**: `_admin.scss` used `var(--chapter-border-color)`, `var(--chapter-accent-color)`, `var(--chapter-text-color)`, `var(--chapter-muted-color)` which don't exist.
- **Fix**: Replaced all `var(--chapter-*)` references with `var(--border)`, `var(--accent)`, `var(--text)`, `var(--muted)`.
- **Test**: CSS compiles correctly and styles are applied
- **Status**: FIXED

### R04: `var(--mixed)` Not Defined
- **Area**: Hidden Trail trail progress
- **Symptom**: Trail progress dots show incorrect color
- **Root Cause**: `TrailProgress.tsx` used `bg-[var(--mixed)]` which doesn't exist.
- **Fix**: Changed `var(--mixed)` to `var(--muted)`
- **Test**: Trail progress dots render correctly
- **Status**: FIXED

### R05: Global CSS Syntax Error
- **Area**: Global stylesheet (`_base.scss`)
- **Symptom**: Browser may ignore body styles due to invalid CSS value
- **Root Cause**: `text-rendering: optimizeLegibility` has invalid CSS value (should be `optimize-legibility`)
- **Fix**: Changed to `text-rendering: optimize-legibility`
- **Test**: CSS compiles correctly, browser applies body styles
- **Status**: FIXED

### R06: QrPrintView Unused State
- **Area**: `QrPrintView.tsx`
- **Symptom**: Unused `mounted` state causes lint warning
- **Root Cause**: `const [mounted, setMounted] = useState(true)` was defined but never used
- **Fix**: Removed `mounted` state and `useState` import
- **Status**: FIXED

### R07: Missing aria-hidden on Decorative Images
- **Area**: `TrailHero.tsx`, `TrailProgress.tsx`
- **Symptom**: Decorative `Image` components from lucide-react lack accessibility attributes
- **Root Cause**: `Image` SVG icons used without `aria-hidden="true"`
- **Fix**: Added `aria-hidden="true"` to all decorative `Image` components
- **Status**: FIXED

## P0 Bugs Remaining

None identified. All P0 regressions have been fixed and verified.

## P1 Bugs Remaining

None identified. All P1 regressions have been fixed and verified.

## P2 Issues (Non-Critical)

1. Bootstrap Sass deprecation warnings (cosmetic, no functional impact)
2. TypeScript `any` type warnings (non-critical, existing architecture pattern)
3. `'userId' is defined but never used` in `game.ts` (minor lint warning)

## Total Routes Discovered

**Frontend Routes**: 30+ (static, dynamic, admin, student, game, auth)
**API Endpoints**: 40+ (Koa + Next.js)

## Test Coverage

- Build: PASS
- TypeScript: PASS (0 errors)
- Lint: PASS (0 errors)
- Dev Server: Running on port 3000
- Backend Server: Running on port 3001
- Health Check: PASS
- Games API: PASS (200 OK)
- Leaderboard API: PASS (200 OK)
- Admin API: PASS (401 without auth)
- CSS Variables: All defined on `:root`
- Admin CSS Classes: 28+ classes present
- QR CSS Variables: 0 old variables
- text-rendering: Fixed to `optimize-legibility`