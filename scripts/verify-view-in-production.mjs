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

console.log('🔍 Verificando Vista en Producción');
console.log('===================================\n');
console.log(`URL: ${supabaseUrl}\n`);

// Consultar la vista directamente
const photographerId = '113363b3-4be8-48e5-b733-c48407d3fc01';

console.log('📊 Consultando photographer_earnings_summary...\n');

const { data, error } = await supabase
  .from('photographer_earnings_summary')
  .select('*')
  .eq('photographer_id', photographerId)
  .single();

if (error) {
  console.error('❌ Error:', error);
  console.log('\n⚠️  Esto indica que hay un problema con la vista en producción.');
} else {
  console.log('✅ Datos obtenidos de la vista:\n');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n');

  // Validar si los datos son correctos
  if (data.total_requests === 0 && data.total_earnings === null) {
    console.log('❌ PROBLEMA DETECTADO:');
    console.log('   La vista está devolviendo valores en 0/null');
    console.log('   Esto significa que el SQL NO se aplicó correctamente en producción.\n');
    console.log('✅ SOLUCIÓN:');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('   2. Verifica que estás en el proyecto correcto (URL arriba)');
    console.log('   3. Ejecuta el archivo: supabase-fix-photographer-summary.sql');
    console.log('   4. Espera a que se complete la ejecución');
    console.log('   5. Vuelve a verificar con este script');
  } else if (data.total_requests > 0 && data.total_earnings > 0) {
    console.log('✅ VISTA FUNCIONANDO CORRECTAMENTE');
    console.log(`   - ${data.total_requests} solicitudes`);
    console.log(`   - ${data.total_photos} fotos`);
    console.log(`   - $${data.total_earnings} total`);
    console.log(`   - $${data.pending_amount} pendiente`);
  }
}

console.log('\n');

// Mostrar todos los fotógrafos para verificar
console.log('📋 TODOS los fotógrafos en la vista:\n');
const { data: allPhotographers, error: allError } = await supabase
  .from('photographer_earnings_summary')
  .select('photographer_name, total_requests, total_photos, total_earnings')
  .order('photographer_name');

if (allError) {
  console.error('❌ Error:', allError);
} else {
  console.log(`Total fotógrafos en la vista: ${allPhotographers.length}\n`);
  allPhotographers.forEach(p => {
    console.log(`   ${p.photographer_name}:`);
    console.log(`     Solicitudes: ${p.total_requests}`);
    console.log(`     Fotos: ${p.total_photos || 0}`);
    console.log(`     Ganancias: $${p.total_earnings || 0}`);
    console.log('');
  });
}
