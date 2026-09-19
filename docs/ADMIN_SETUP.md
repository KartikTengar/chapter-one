# Admin Setup (Safe — no secrets, no hardcoded accounts)

## Trusted role management

1. Sign up through `/signup`. The database always creates a `student` profile, regardless of signup metadata.
2. An authorized database operator must verify the account UUID and use the Supabase SQL Editor or a trusted database console as `postgres`, without an end-user JWT context:

```sql
BEGIN;
UPDATE public.profiles SET role = 'admin' WHERE id = '<verified-user-uuid>';
COMMIT;
```

Check that exactly one intended row was updated before committing. Demotion uses the same trusted process with `role = 'student'`. Never expose this operation through an application-admin API, RPC, browser client, or service key. Application admins are still `authenticated` database clients; being an application admin does not grant role-management permission.

The migration does not reset existing admins. Review existing privileged accounts separately against an approved roster; previous signup metadata is not evidence of authorization.

## Phase 3 migration plan

### Backups and prerequisites

- No remote mutation is performed by this repository change. Application, rollback, and deployment validation are operator-run steps requiring separate approval.
- Before applying, take a restorable database backup, including profile data, existing roles, function definitions/owners/ACLs, policies, triggers, and both table and column grants. Verify restoration in isolated staging. Keep backups and credentials outside the repository and logs.
- Apply as the trusted Supabase `postgres` database role. The security-definer functions are explicitly owned by `postgres`; this role must own `public.profiles` or bypass its RLS. The no-argument admin helper fails closed if its owner cannot bypass RLS. The migrations require the existing Supabase `auth` schema and `anon`, `authenticated`, and `service_role` roles.
- Review deployment-specific profile policies, role memberships, inherited grants, security-definer RPCs, and custom triggers before release. The migration replaces the four repository profile policies, not unknown custom policies. Do not retain custom policies that expose other students' data or RPCs that allow privileged profile insertion/deletion or role management. Ensure client roles cannot assume `postgres`, own profiles, or disable triggers.

### Apply order

- Fresh installation: apply `database/migration.sql` once, then `database/migration_auth_role_hardening.sql`. The base is transactional but is not a rerunnable migration; its profile hardening matches the additive migration.
- Installed deployment: do not rerun the base. Apply only `database/migration_auth_role_hardening.sql` after the base is already installed. This additive migration is transactional and rerunnable; it replaces functions, the invariant trigger, the four profile policies, and profile client write grants without updating profile data.
- Existing `migration_rls_cancel.sql` and `migration_hidden_trail.sql` remain separate feature migrations requiring the base; this hardening works whether or not they are installed. Do not rerun or add them solely for Phase 3. Their tables, grants, and policies are unchanged. They require their own staging validation.
- Use a controlled deployment window: function, trigger, policy, and ACL changes acquire database locks. A failed transaction must be rolled back before retrying the complete additive file.

### Access guarantees and staging validation

- Signup assigns the literal `student` role. The signup trigger and invariant trigger functions have no client execution grant.
- `public.is_profile_admin()` returns only the calling user's admin status via `auth.uid()`, accepts no account ID, uses an empty search path, and is executable only by `authenticated` clients and its owner. Profile admin policies use this helper instead of recursively querying their own RLS-protected table.
- Table-level profile UPDATE is revoked from `PUBLIC`, `anon`, and `authenticated`, and all existing column-level INSERT/UPDATE grants for those grantees are cleared. Only `full_name`, `email`, `avatar_url`, `college_id`, `year`, `branch`, and `phone` receive authenticated UPDATE permission. Profile INSERT, DELETE, and TRUNCATE client table grants are also removed; signup still uses the trusted trigger. Profile SELECT is granted to authenticated users and constrained by RLS.
- Students can read and edit their own profile; application admins can read all profiles and edit the same allowed fields on other profiles. Send only editable fields in update payloads, not an entire profile containing `id`, `role`, or timestamps. `updated_at` remains maintained by the existing trigger; `created_at` is not client-editable.
- An AFTER UPDATE security-invoker trigger checks final `id`/`role` values, including changes made by BEFORE triggers. Changes require effective `postgres`, no active client database role, and no end-user `auth.uid()`. Missing JWT claims alone do not authorize a client. Service-role updates cannot change these invariants either. Direct trusted database maintenance remains possible.
- In isolated staging, validate signup, student own-profile reads/edits and row isolation, admin reads/other-profile edits, unchanged existing admin roles, helper/column ACLs, invariant enforcement, and trusted operator promotion/demotion. Apply the additive migration twice and compare resulting definitions/ACLs. Verify registration/event workflows still work. Local PostgreSQL checks are not a substitute for Supabase Auth/PostgREST staging checks.

### Rollback

- Before COMMIT, use ROLLBACK on any error; no partial additive migration should remain.
- After COMMIT, prefer a reviewed forward fix retaining literal student signup and protected identity/role columns. Do not casually restore the old metadata-based signup function, recursive policies, or broad client UPDATE grants.
- If restoration is unavoidable, stop client writes, restore the captured definitions/ACLs and any necessary data from the verified backup through a trusted operator, assess the restored security posture, and revalidate in staging before reopening access. There is intentionally no automatic destructive down migration or admin-role reset.
