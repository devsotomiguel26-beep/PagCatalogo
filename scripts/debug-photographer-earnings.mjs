#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const photographerId = '113363b3-4be8-48e5-b733-c48407d3fc01';

console.log('🔍 Debugging Photographer Earnings');
console.log('====================================\n');

// 1. Verificar fotógrafo
console.log('1️⃣ FOTÓGRAFO:');
const { data: photographer, error: photoError } = await supabase
  .from('photographers')
  .select('*')
  .eq('id', photographerId)
  .single();

if (photoError) {
  console.error('❌ Error:', photoError);
} else {
  console.log('✅ Encontrado:', photographer);
}
console.log('\n');

// 2. Verificar galerías asociadas
console.log('2️⃣ GALERÍAS ASOCIADAS:');
const { data: galleries, error: galError } = await supabase
  .from('galleries')
  .select('id, title, slug')
  .eq('photographer_id', photographerId);

if (galError) {
  console.error('❌ Error:', galError);
} else {
  console.log(`✅ ${galleries.length} galerías encontradas:`);
  galleries.forEach(g => console.log(`   - ${g.title} (${g.slug})`));
}
console.log('\n');

// 3. Verificar solicitudes pagadas/entregadas
if (galleries && galleries.length > 0) {
  const galleryIds = galleries.map(g => g.id);

  console.log('3️⃣ SOLICITUDES PAGADAS/ENTREGADAS:');
  const { data: requests, error: reqError } = await supabase
    .from('photo_requests')
    .select('id, client_name, status, settlement_status, photo_ids, transaction_details, is_test')
    .in('gallery_id', galleryIds)
    .in('status', ['paid', 'delivered', 'expired']);

  if (reqError) {
    console.error('❌ Error:', reqError);
  } else {
    console.log(`✅ ${requests.length} solicitudes encontradas:\n`);
    requests.forEach(r => {
      console.log(`   📋 ${r.client_name} (${r.status})`);
      console.log(`      ID: ${r.id}`);
      console.log(`      Fotos: ${r.photo_ids?.length || 0}`);
      console.log(`      Settlement: ${r.settlement_status || 'null'}`);
      console.log(`      Es prueba: ${r.is_test || false}`);
      console.log(`      Transaction details: ${r.transaction_details ? 'SÍ' : 'NO'}`);
      if (r.transaction_details) {
        const td = r.transaction_details;
        const photoShare = td.photographer_share || td.breakdown?.photographer_share || 0;
        console.log(`      Ganancia fotógrafo: $${photoShare}`);
      }
      console.log('');
    });
  }
}
console.log('\n');

// 4. Verificar vista photographer_earnings_summary
console.log('4️⃣ VISTA photographer_earnings_summary:');
const { data: summary, error: summaryError } = await supabase
  .from('photographer_earnings_summary')
  .select('*')
  .eq('photographer_id', photographerId)
  .single();

if (summaryError) {
  console.error('❌ Error:', summaryError);
  if (summaryError.code === 'PGRST116') {
    console.log('⚠️  El fotógrafo NO aparece en la vista');
  }
} else {
  console.log('✅ Datos de la vista:');
  console.log(JSON.stringify(summary, null, 2));
}
console.log('\n');

// 5. Verificar vista pending_earnings
console.log('5️⃣ VISTA pending_earnings:');
const { data: pending, error: pendingError } = await supabase
  .from('pending_earnings')
  .select('*')
  .eq('photographer_id', photographerId);

if (pendingError) {
  console.error('❌ Error:', pendingError);
} else {
  console.log(`✅ ${pending.length} ganancias pendientes encontradas:`);
  pending.forEach(p => {
    console.log(`   - ${p.gallery_title}: ${p.client_name} - $${p.photographer_share}`);
  });
}
console.log('\n');

// 6. Query manual para simular la vista
console.log('6️⃣ QUERY MANUAL (simulando la vista):');
const { data: manualQuery, error: manualError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT
      COUNT(DISTINCT pr.id) as total_requests,
      COALESCE(SUM(ARRAY_LENGTH(pr.photo_ids, 1)), 0) as total_photos,
      COALESCE(SUM(
        COALESCE(
          (pr.transaction_details->>'photographer_share')::numeric,
          (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
          0
        )
      ), 0) as total_earnings
    FROM photographers p
    LEFT JOIN galleries g ON g.photographer_id = p.id
    LEFT JOIN photo_requests pr ON pr.gallery_id = g.id
      AND pr.status IN ('paid', 'delivered', 'expired')
      AND pr.transaction_details IS NOT NULL
      AND COALESCE(pr.is_test, false) = false
    WHERE p.id = '${photographerId}'
    GROUP BY p.id
  `
});

if (!manualError && manualQuery) {
  console.log('✅ Resultado query manual:');
  console.log(manualQuery);
} else {
  // Si no existe la función RPC, hacer query directamente
  console.log('⚠️  Usando método alternativo...');

  const { data: allRequests } = await supabase
    .from('photo_requests')
    .select(`
      id,
      photo_ids,
      transaction_details,
      is_test,
      status,
      galleries!inner (
        photographer_id
      )
    `)
    .eq('galleries.photographer_id', photographerId)
    .in('status', ['paid', 'delivered', 'expired']);

  if (allRequests) {
    const filtered = allRequests.filter(r =>
      r.transaction_details &&
      (r.is_test === false || r.is_test === null)
    );

    console.log(`   Total solicitudes (sin filtros): ${allRequests.length}`);
    console.log(`   Solicitudes filtradas (con transaction_details, no test): ${filtered.length}`);

    const totalPhotos = filtered.reduce((sum, r) => sum + (r.photo_ids?.length || 0), 0);
    const totalEarnings = filtered.reduce((sum, r) => {
      const td = r.transaction_details;
      const share = td?.photographer_share || td?.breakdown?.photographer_share || 0;
      return sum + parseFloat(share);
    }, 0);

    console.log(`   Total fotos: ${totalPhotos}`);
    console.log(`   Total ganancias: $${totalEarnings}`);
  }
}

console.log('\n✅ Debug completo');
