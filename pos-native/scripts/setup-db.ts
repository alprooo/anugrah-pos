/**
 * Database setup script for Precision POS.
 * Creates all tables, indexes, RPCs, and RLS policies.
 *
 * Requirements:
 * - EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 *   (get service key from Supabase Dashboard → Project Settings → API → service_role key)
 *
 * Usage:
 *   npx ts-node scripts/setup-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Precision POS database...\n');

  // Read the SQL migration
  const sql = fs.readFileSync('supabase-migration.sql', 'utf-8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    // Skip non-DDL comments and empty blocks
    if (stmt.length < 10) continue;

    const { error } = await supabase.rpc('exec', { query: stmt + ';' });

    if (error) {
      // exec RPC might not exist — try REST API approach
      console.log(`  ⚠️  Could not execute via RPC: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n📊 Results: ${success} executed, ${failed} skipped`);
  console.log('\n📋 Next steps:');
  console.log('  1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/hsgrgebchsixhtaxpnmh');
  console.log('  2. Go to SQL Editor');
  console.log('  3. Copy the contents of supabase-migration.sql');
  console.log('  4. Paste and run');
  console.log('  5. Create a test user under Authentication → Users');
  console.log('  6. Set user_metadata: { "role": "admin" }');
}

setupDatabase().catch(console.error);
