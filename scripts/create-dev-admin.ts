#!/usr/bin/env tsx
/**
 * Development-only admin seed script
 * Creates admin@chapterone.local with password ChapterOne_Admin_2026!
 * Requires NODE_ENV=development
 * Uses Supabase service-role key via backend client
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load backend development environment before importing backend modules
config({ path: resolve(process.cwd(), 'backend', '.env') });
config({ path: resolve(process.cwd(), '.env.local') }); // fallback

// Fallback mapping for local dev if backend env not fully configured
if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
}

const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV !== 'development') {
  console.error('❌ This script can only run in development. Set NODE_ENV=development');
  process.exit(1);
}

const EMAIL = process.env.DEV_ADMIN_EMAIL ?? 'admin@chapterone.local';
const PASSWORD = process.env.DEV_ADMIN_PASSWORD ?? 'ChapterOne_Admin_2026!';

async function main() {
  const { getSupabaseAdmin } = await import('../backend/src/services/supabase.js');
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
  }

  // Check if user exists
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to list users', listError.message);
    process.exit(1);
  }

  let user = existingUsers.users.find(u => u.email === EMAIL);

  if (!user) {
    console.log(`Creating admin user ${EMAIL}...`);
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {},
    });
    if (error) {
      console.error('❌ Failed to create user', error.message);
      process.exit(1);
    }
    user = data.user;
    console.log('✅ User created', user.id);
  } else {
    console.log(`User already exists: ${user.id}`);
    // Optionally reset password
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: PASSWORD });
    if (error) console.warn('⚠️ Could not update password', error.message);
    else console.log('✅ Password reset');
  }

  // Ensure profile exists and role is admin
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Failed to fetch profile', profileError.message);
    process.exit(1);
  }

  if (!profile) {
    console.log('Creating profile...');
    const { error: insertError } = await admin.from('profiles').insert({
      id: user.id,
      full_name: 'Dev Admin',
      role: 'admin',
    });
    if (insertError) {
      console.error('❌ Failed to create profile', insertError.message);
      process.exit(1);
    }
    console.log('✅ Profile created with admin role');
  } else if (profile.role !== 'admin') {
    console.log('Upgrading profile role to admin...');
    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);
    if (updateError) {
      console.error('❌ Failed to update role', updateError.message);
      process.exit(1);
    }
    console.log('✅ Profile role updated to admin');
  } else {
    console.log('✅ Profile already exists with admin role');
  }

  console.log('\nDev admin ready:');
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log('Login at /admin/login');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
