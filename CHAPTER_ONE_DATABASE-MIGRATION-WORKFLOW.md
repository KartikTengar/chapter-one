# CHAPTER ONE - Database Migration Workflow

## Status
Migrations were historically applied manually via Supabase SQL Editor. Repository contains SQL files under `database/` but no Supabase CLI `supabase/migrations/` history. Phase 5 establishes baseline hardening and workflow going forward.

## Current Migration Files

- `database/migration.sql` - Initial profiles, events, registrations, RLS, triggers, admin helpers.
- `database/migration_rls_cancel.sql` - Allow students to DELETE own event registrations.
- `database/migration_hidden_trail.sql` - QR game tables, policies, secure RPC functions, test data.
- `database/migration_auth_role_hardening.sql` - Re-hardens profile trigger, admin check, RLS policies.
- `database/migration_phase5_hardening.sql` - Phase 5 hardening: CHECK constraints, function hardening, policy centralization.

## Supabase CLI Setup

Initialize CLI once:
```bash
npm i -g supabase
supabase init
```

Configure `supabase/config.toml` with project ref.

Link to remote:
```bash
supabase link --project-ref <your-ref>
```

## Migration Workflow Going Forward

1. **Create local branch**
   ```bash
   git checkout -b db/hardening-phase5
   ```

2. **Create migration via CLI**
   ```bash
   supabase migration new phase5_hardening
   ```
   Edit `supabase/migrations/<timestamp>_phase5_hardening.sql`.

3. **Develop additive changes only**
   - No `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN TYPE` that loses data.
   - Use `CREATE TABLE IF NOT EXISTS`, `ADD CONSTRAINT IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` patterns via DO blocks.
   - Prefer `CREATE OR REPLACE FUNCTION` with hardened SECURITY DEFINER settings.

4. **Local test**
   ```bash
   supabase start
   supabase db reset
   supabase db push
   ```

5. **Review**
   ```bash
   git diff
   ```
   Ensure changes are additive and reversible.

6. **Push to remote**
   ```bash
   supabase db push
   ```
   Or apply via SQL Editor for manual control.

7. **Commit**
   ```bash
   git add supabase/migrations/
   git commit -m "db: Phase 5 hardening - CHECK constraints + function hardening"
   ```

## Reconciliation Steps for Existing Manual Migrations

1. Dump current schema:
   ```bash
   supabase db dump -s public --data-only=false > schema_dump.sql
   ```

2. Compare with repository migrations.
3. Create baseline migration file `supabase/migrations/0000_baseline.sql` containing the current schema snapshot.
4. Going forward, only use CLI migrations.

## Safety Rules

- Never apply destructive changes to production without backup.
- Always test migrations against a copy of production data.
- Pin `search_path = ''` on all SECURITY DEFINER functions.
- Set function owner to `postgres`, REVOKE from PUBLIC.
- Use centralized `is_profile_admin()` for admin checks.
- Add constraints with IF NOT EXISTS guards.
- Keep migrations idempotent.

## Rollback Strategy

PostgreSQL migrations are not automatically reversible. For each migration:
- Document the reverse steps in comments.
- For additive constraints, rollback is `ALTER TABLE ... DROP CONSTRAINT`.
- For policies, rollback is `DROP POLICY`.
- Keep backups before production pushes.

## Storage Migrations

Storage buckets and policies are not covered by `supabase/migrations/` by default. Use Supabase Dashboard for initial bucket creation, then export policies to SQL and store in `database/storage_policies.sql`.

## References

- Supabase docs on migrations: https://supabase.com/docs/guides/deployment/migrations
- Phase 5 hardening: `database/migration_phase5_hardening.sql`
- Security overview: `CHAPTER_ONE_README-SUPABASE-SECURITY.md`
