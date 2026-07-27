/**
 * Seed script for Precision POS — run after schema migration.
 *
 * Usage:
 *   1. First run supabase-migration.sql in Supabase SQL Editor
 *   2. Create a test user in Supabase Auth (Dashboard → Authentication → Users)
 *   3. Set their role in user_metadata: { "role": "admin" }
 *   4. Run: npx ts-node scripts/seed.ts
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SERVICE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  // Add sample products
  const products = [
    { barcode: '8992769100012', sku: 'BUKU-001', name: 'Buku Tulis Sidu 38 Lembar', price: 5000, cost: 3500 },
    { barcode: '8992769100029', sku: 'PEN-001', name: 'Pulpen Standard AE7', price: 3000, cost: 2000 },
    { barcode: '8992769100036', sku: 'PEN-002', name: 'Pensil 2B Faber-Castell', price: 4000, cost: 2500 },
    { barcode: '8992769100043', sku: 'BUKU-002', name: 'Buku Kotak Kiky A5', price: 8000, cost: 5500 },
    { barcode: '8992769100050', sku: 'TAPE-001', name: 'Selotip Bening 1 Inch', price: 3000, cost: 1800 },
    { barcode: '8992769100067', sku: 'BAG-001', name: 'Plastik Pembungkus', price: 1000, cost: 500 },
  ];

  for (const p of products) {
    const { data, error } = await supabase
      .from('products')
      .insert(p)
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to insert ${p.name}:`, error.message);
      continue;
    }

    // Create inventory record
    const { error: invError } = await supabase
      .from('inventory')
      .insert({
        product_id: data.id,
        quantity_on_hand: 50,
        reorder_threshold: 10,
      });

    if (invError) {
      console.error(`Failed to create inventory for ${p.name}:`, invError.message);
    } else {
      console.log(`✅ Added: ${p.name} (Rp${p.price.toLocaleString('id-ID')})`);
    }
  }

  console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
