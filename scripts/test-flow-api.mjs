#!/usr/bin/env node

import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log('🧪 Probando Flow API - getPaymentStatus\n');

// Credenciales de producción
const apiKey = process.env.FLOW_PRODUCTION_API_KEY;
const secretKey = process.env.FLOW_PRODUCTION_SECRET_KEY;

console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 10)}...` : 'NOT FOUND');
console.log('');

if (!apiKey || !secretKey) {
  console.error('❌ Credenciales de Flow no configuradas');
  process.exit(1);
}

// Probar con una orden que sabemos que está "Por depositar"
const testOrders = [
  { order: '157424164', expected: 'Por depositar' },
  { order: '157331211', expected: 'Depositado' },
];

for (const test of testOrders) {
  console.log(`📋 Probando orden ${test.order} (esperado: ${test.expected})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Construir parámetros
    const params = {
      apiKey: apiKey,
      token: test.order,
    };

    // Crear string para firma (ordenado alfabéticamente)
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    console.log('   Param string:', paramString);

    // Crear firma HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(paramString)
      .digest('hex');

    console.log('   Signature:', signature.substring(0, 20) + '...');

    // Construir URL
    const url = new URL('https://www.flow.cl/api/payment/getStatus');
    url.searchParams.append('apiKey', apiKey);
    url.searchParams.append('token', test.order);
    url.searchParams.append('s', signature);

    console.log('   URL:', url.toString().replace(apiKey, 'API_KEY').replace(signature, 'SIGNATURE'));

    // Hacer request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('   Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error:', errorText);
      continue;
    }

    const data = await response.json();

    console.log('   ✅ Respuesta recibida:');
    console.log('      flowOrder:', data.flowOrder);
    console.log('      status:', data.status); // 1=pending, 2=paid, 3=rejected, 4=cancelled
    console.log('      amount:', data.amount);
    console.log('      payer:', data.payer);
    console.log('      paymentDate:', data.paymentDate);

    if (data.pending_info) {
      console.log('      pending_info:');
      console.log('        status:', data.pending_info.status); // 1=Por depositar, 2=Depositado
      console.log('        date:', data.pending_info.date);

      const depositStatus = data.pending_info.status === 2 ? 'Depositado' : data.pending_info.status === 1 ? 'Por depositar' : 'Desconocido';
      console.log(`      📊 Estado de depósito: ${depositStatus}`);

      if (depositStatus === test.expected) {
        console.log('      ✅ COINCIDE con lo esperado');
      } else {
        console.log(`      ⚠️  DIFERENTE a lo esperado (${test.expected})`);
      }
    } else {
      console.log('      ⚠️  No hay información de pending_info');
    }

    console.log('');
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.log('');
  }
}

console.log('✅ Pruebas completadas');
