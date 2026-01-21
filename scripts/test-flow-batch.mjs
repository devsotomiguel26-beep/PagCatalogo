#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log('🧪 Probando integración batch de Flow API\n');

// Credenciales
const apiKey = process.env.FLOW_PRODUCTION_API_KEY;
const secretKey = process.env.FLOW_PRODUCTION_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey || !secretKey) {
  console.error('❌ Credenciales de Flow no configuradas');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciales de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función helper para consultar Flow API
async function getFlowPaymentStatus(token) {
  try {
    const params = {
      apiKey: apiKey,
      token: token,
    };

    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(paramString)
      .digest('hex');

    const url = new URL('https://www.flow.cl/api/payment/getStatus');
    url.searchParams.append('apiKey', apiKey);
    url.searchParams.append('token', token);
    url.searchParams.append('s', signature);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Flow API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();

    return {
      flowOrder: data.flowOrder,
      status: data.status,
      depositStatus: data.pending_info?.status,
      transferDate: data.pending_info?.date,
      raw: data,
    };
  } catch (error) {
    console.error('❌ Error calling Flow API:', error);
    return null;
  }
}

// Obtener algunas solicitudes pagadas recientes
console.log('📋 Obteniendo solicitudes pagadas de la base de datos...\n');

const { data: requests, error } = await supabase
  .from('photo_requests')
  .select('id, client_name, flow_order, payment_data, payment_date')
  .eq('status', 'paid')
  .not('flow_order', 'is', null)
  .order('payment_date', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`✅ ${requests.length} solicitudes encontradas\n`);
console.log('━'.repeat(80));

for (const req of requests) {
  console.log(`\n📦 Solicitud: ${req.client_name}`);
  console.log(`   Flow Order: ${req.flow_order}`);
  console.log(`   Pago: ${req.payment_date}`);
  console.log(`   Token en DB: ${req.payment_data?.token ? '✅ SÍ' : '❌ NO'}`);

  if (req.payment_data?.token) {
    console.log(`\n   🔄 Consultando Flow API con token...`);

    const status = await getFlowPaymentStatus(req.payment_data.token);

    if (status) {
      console.log(`   ✅ Respuesta recibida:`);
      console.log(`      Flow Order: ${status.flowOrder}`);
      console.log(`      Status pago: ${status.status} (2=pagado)`);

      if (status.depositStatus !== undefined) {
        const depositText = status.depositStatus === 2 ? 'Depositado' :
                           status.depositStatus === 1 ? 'Por depositar' :
                           'Desconocido';
        console.log(`      Estado depósito: ${depositText} (${status.depositStatus})`);
        console.log(`      Fecha transferencia: ${status.transferDate || 'N/A'}`);
      } else {
        console.log(`      ⚠️  No hay información de pending_info`);
      }
    } else {
      console.log(`   ❌ No se pudo obtener el estado`);
    }
  } else {
    console.log(`   ⚠️  Sin token - dato histórico, no se puede consultar`);
  }

  console.log('   ' + '─'.repeat(76));
}

console.log('\n' + '━'.repeat(80));
console.log('✅ Prueba completada');
