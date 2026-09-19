# SUPABASE DATABASE - CHAPTER ONE

## Live Reconciliation Phase 5B

**Project:** csnhvvbezzbpmhqgxrhr

### Before Reconciliation
- Tables present: public.profiles, public.events, public.event_registrations
- Hidden Trail tables missing
- `handle_new_user()` trusted `raw_user_meta_data->>'role'` → admin escalation vulnerability
- Policies used `is_admin()` helper; repository expects `is_profile_admin()`
- Function security: search_path = 'public', grants too permissive
- Hidden Trail functions / schema not deployed

### After Reconciliation
- `handle_new_user()` hardcodes role = 'student', security definer, search_path = '', owner postgres, revoked from public
- Canonical admin helper `is_profile_admin()` deployed, `is_admin()` wrapper for compatibility
- Hidden Trail schema deployed: qr_games, qr_levels, qr_participants, qr_completions, qr_scan_logs, qr_admin_audit, achievements, user_achievements
- RLS enabled on all tables with student/admin boundaries
- CHECK constraints added: qr_games status, qr_games time, qr_levels game_level unique, qr_participants status, qr_completions scanner_position >=0, qr_scan_logs result domain
- Functions hardened: start_qr_participant, validate_qr_token, process_qr_answer, hash_answer
- No test data inserted

### Migration Safety
- Additive only, CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION
- No DROP, no data deletion
- Existing profiles/events/event_registrations untouched

### RLS Model
- Profiles: students read/update own; admins read/update all
- Events: public read; admin CUD
- Event registrations: students create/read/delete own; admin read/delete all
- QR games: students read active; admin manage
- QR levels: students read active levels for active games; admin manage
- Participants/completions/scan logs: students own; admin manage
- Admin audit: admin only

### Storage
event-covers bucket status pending manual verification.

### Migration File
database/migration_phase5b_live_reconciliation.sql
