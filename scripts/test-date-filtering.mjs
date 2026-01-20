import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateFiltering() {
  console.log('🔍 Probando filtrado de fechas para liquidación...\n');

  // ID de Alejandro Dubó (según el debug anterior)
  const photographerId = '113363b3-4be8-48e5-b733-c48407d3fc01';

  // El usuario probablemente está seleccionando un rango de fechas tipo:
  // Fecha inicio: 2026-01-15 (o similar)
  // Fecha fin: 2026-01-19 o 2026-01-20

  // Probemos con diferentes rangos
  const testRanges = [
    { start: '2026-01-15', end: '2026-01-19', description: 'Rango hasta hoy (19)' },
    { start: '2026-01-15', end: '2026-01-20', description: 'Rango hasta mañana (20)' },
    { start: '2026-01-19', end: '2026-01-19', description: 'Solo el día 19' },
    { start: '2026-01-01', end: '2026-01-31', description: 'Todo enero' },
  ];

  for (const range of testRanges) {
    console.log('='.repeat(80));
    console.log(`📅 ${range.description}`);
    console.log(`   Desde: ${range.start}`);
    console.log(`   Hasta: ${range.end}`);
    console.log('='.repeat(80));

    // Exactamente la misma query que usa el endpoint de preview
    const { data: pendingEarnings, error } = await supabase
      .from('pending_earnings')
      .select('*')
      .gte('request_date', range.start)
      .lte('request_date', range.end)
      .eq('photographer_id', photographerId)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      continue;
    }

    console.log(`\n✅ Encontradas ${pendingEarnings.length} solicitud(es)\n`);

    if (pendingEarnings.length > 0) {
      for (const earning of pendingEarnings) {
        console.log(`   - Cliente: ${earning.client_name}`);
        console.log(`     Fecha: ${earning.request_date}`);
        console.log(`     Fotos: ${earning.photo_count}`);
        console.log(`     Monto: $${earning.photographer_share}`);
        console.log();
      }
    } else {
      console.log('   ⚠️  Ninguna solicitud encontrada con este rango');
    }
    console.log();
  }

  // Ahora mostrar TODAS las solicitudes pendientes de Alejandro sin filtro de fecha
  console.log('='.repeat(80));
  console.log('📋 TODAS las solicitudes pendientes de Alejandro Dubó (sin filtro de fecha):');
  console.log('='.repeat(80));

  const { data: allPending, error: allError } = await supabase
    .from('pending_earnings')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('request_date', { ascending: false });

  if (allError) {
    console.error('❌ Error:', allError);
  } else {
    console.log(`\n✅ Total: ${allPending.length} solicitud(es)\n`);

    for (const earning of allPending) {
      console.log(`   - Cliente: ${earning.client_name}`);
      console.log(`     Fecha: ${earning.request_date}`);
      console.log(`     Status: ${earning.request_status} / ${earning.settlement_status}`);
      console.log(`     Fotos: ${earning.photo_count}`);
      console.log(`     Monto: $${earning.photographer_share}`);
      console.log();
    }
  }
}

testDateFiltering()
  .then(() => {
    console.log('✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
