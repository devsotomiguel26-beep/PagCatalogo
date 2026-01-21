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

console.log('🔍 Verificando estructura de payment_data para consultar Flow API\n');

const { data, error } = await supabase
  .from('photo_requests')
  .select('id, client_name, flow_order, payment_data')
  .eq('flow_order', 157424164)
  .single();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Solicitud encontrada:');
  console.log('   Cliente:', data.client_name);
  console.log('   Flow Order:', data.flow_order);
  console.log('\n📋 Payment Data completo:');
  console.log(JSON.stringify(data.payment_data, null, 2));

  console.log('\n🔑 Campos importantes:');
  console.log('   - flowOrder:', data.payment_data?.flowOrder);
  console.log('   - token (si existe):', data.payment_data?.token || 'NO EXISTE');
  console.log('   - status:', data.payment_data?.status);

  console.log('\n💡 Para consultar Flow API necesitamos usar:');
  if (data.payment_data?.token) {
    console.log(`   Token: ${data.payment_data.token}`);
  } else if (data.payment_data?.flowOrder) {
    console.log(`   Flow Order: ${data.payment_data.flowOrder} (probar como token)`);
  }
}
