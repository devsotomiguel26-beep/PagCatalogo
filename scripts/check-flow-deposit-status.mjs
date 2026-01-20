#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verificando estructura de payment_data de Flow\n');
console.log('Buscando campo de estado de depósito (Depositado/Por Depositar)\n');

const { data: requests, error } = await supabase
  .from('photo_requests')
  .select('id, client_name, payment_data, status')
  .in('status', ['paid', 'delivered', 'expired'])
  .not('is_test', 'eq', true)
  .not('payment_data', 'is', null)
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`✅ ${requests.length} solicitudes con payment_data:\n`);
  requests.forEach(r => {
    console.log(`\n📋 ${r.client_name} (${r.status}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const pd = r.payment_data;

    // Buscar campos relacionados con depósito
    console.log('Campos en payment_data:');
    Object.keys(pd).forEach(key => {
      console.log(`  - ${key}: ${typeof pd[key] === 'object' ? JSON.stringify(pd[key]) : pd[key]}`);
    });

    // Buscar específicamente campos de depósito
    if (pd.status) console.log(`\n  ⭐ status: ${pd.status}`);
    if (pd.paymentMethod) console.log(`  ⭐ paymentMethod: ${pd.paymentMethod}`);
    if (pd.deposited !== undefined) console.log(`  ⭐ deposited: ${pd.deposited}`);
    if (pd.depositStatus) console.log(`  ⭐ depositStatus: ${pd.depositStatus}`);
    if (pd.transferStatus) console.log(`  ⭐ transferStatus: ${pd.transferStatus}`);
  });

  console.log('\n\n📊 RESUMEN DE ESTRUCTURA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (requests.length > 0) {
    console.log('Campos disponibles en payment_data:');
    const allKeys = new Set();
    requests.forEach(r => {
      Object.keys(r.payment_data).forEach(k => allKeys.add(k));
    });
    console.log(Array.from(allKeys).sort().map(k => `  - ${k}`).join('\n'));
  }
}
