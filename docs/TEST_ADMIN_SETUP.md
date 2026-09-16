# Test Admin Setup (Local Development Only)

Do NOT commit real secrets.

Step 1 — Create admin user (Supabase Auth Dashboard or SQL):

-- Create user in auth.users first (via /signup or Auth Dashboard)
-- Then set admin role:
UPDATE profiles SET role = 'admin' WHERE email = 'test-admin@local.dev';

Step 2 — For quick local testing with a known email:

-- Use any existing student account and promote it temporarily:
UPDATE profiles SET role = 'admin' WHERE id = '<existing-user-id>';

-- Verify:
SELECT id, email, role FROM profiles WHERE role = 'admin';

Step 3 — Revert after testing:
UPDATE profiles SET role = 'student' WHERE id = '<user-id>';
