#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verificando estados de pago en la base de datos\n');

// Obtener todas las solicitudes con flow_order
const { data: requests, error } = await supabase
  .from('photo_requests')
  .select('id, client_name, status, flow_order, payment_data, payment_date')
  .not('flow_order', 'is', null)
  .order('payment_date', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`✅ ${requests.length} solicitudes con flow_order\n`);

// Agrupar por estado
const byStatus = requests.reduce((acc, req) => {
  acc[req.status] = (acc[req.status] || 0) + 1;
  return acc;
}, {});

console.log('📊 Distribución por estado:');
Object.entries(byStatus).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}`);
});

console.log('\n📋 Detalle de solicitudes:\n');
console.log('━'.repeat(100));

for (const req of requests) {
  console.log(`Cliente: ${req.client_name}`);
  console.log(`  Flow Order: ${req.flow_order}`);
  console.log(`  Status: ${req.status}`);
  console.log(`  Pago: ${req.payment_date || 'N/A'}`);
  console.log(`  Token en payment_data: ${req.payment_data?.token ? '✅ SÍ' : '❌ NO'}`);
  console.log('─'.repeat(100));
}
