# Admin Setup (Safe — no secrets, no hardcoded accounts)

To create an admin user:

1. Sign up as a student via /signup (profile.role defaults to 'student').
2. In Supabase SQL Editor or database console, run:

UPDATE profiles SET role = 'admin' WHERE email = 'admin@college.edu';

OR for an existing user:

UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';

3. The middleware will then allow access to /admin/* routes.
4. Admin APIs verify server-side via verifyAdmin() (no client-side bypass possible).
