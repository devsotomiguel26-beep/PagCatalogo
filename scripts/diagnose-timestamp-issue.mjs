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

async function diagnoseTimestamp() {
  console.log('🔍 Diagnosticando problema de timestamp...\n');

  // Obtener la hora actual del servidor PostgreSQL
  console.log('='.repeat(80));
  console.log('⏰ HORA ACTUAL DEL SERVIDOR POSTGRESQL:');
  console.log('='.repeat(80));

  const { data: serverTime, error: timeError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        NOW() as server_now_utc,
        NOW() AT TIME ZONE 'America/Santiago' as server_now_chile,
        CURRENT_TIMESTAMP as current_ts
    `
  });

  if (timeError) {
    console.log('⚠️  No se pudo ejecutar query directo (exec_sql no existe)');
    console.log('   Intentando método alternativo...\n');
  } else {
    console.log('Hora servidor UTC:', serverTime);
    console.log();
  }

  // Crear una solicitud de prueba para ver cómo se guarda
  console.log('='.repeat(80));
  console.log('🧪 PRUEBA: Creando registro de prueba');
  console.log('='.repeat(80));

  const now = new Date();
  console.log('Hora local JavaScript:', now.toISOString());
  console.log('Hora Chile (calculada):', now.toLocaleString('es-CL', { timeZone: 'America/Santiago', hour12: false }));
  console.log();

  // Intentar insertar un registro de prueba sin especificar created_at
  console.log('📝 Insertando registro de prueba (created_at automático)...');
  const { data: testRequest1, error: error1 } = await supabase
    .from('photo_requests')
    .insert([
      {
        gallery_id: null,
        photo_ids: ['test'],
        client_name: '__TEST_TIMEZONE_1__',
        client_email: 'test1@test.com',
        client_phone: '+56900000000',
        child_name: 'Test',
        status: 'cancelled',
        is_test: true,
        // NO especificamos created_at, usa default
      },
    ])
    .select('id, created_at')
    .single();

  if (error1) {
    console.error('❌ Error:', error1);
  } else {
    console.log('✅ Registro creado con created_at automático:');
    console.log('   ID:', testRequest1.id);
    console.log('   created_at (raw):', testRequest1.created_at);
    console.log('   created_at (Date):', new Date(testRequest1.created_at).toISOString());
    console.log('   Formateado a Chile:', new Date(testRequest1.created_at).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour12: false
    }));
  }

  console.log();

  // Intentar insertar especificando created_at en UTC
  console.log('📝 Insertando registro especificando created_at en UTC...');
  const { data: testRequest2, error: error2 } = await supabase
    .from('photo_requests')
    .insert([
      {
        gallery_id: null,
        photo_ids: ['test'],
        client_name: '__TEST_TIMEZONE_2__',
        client_email: 'test2@test.com',
        client_phone: '+56900000000',
        child_name: 'Test',
        status: 'cancelled',
        is_test: true,
        created_at: new Date().toISOString(), // Especificamos en ISO UTC
      },
    ])
    .select('id, created_at')
    .single();

  if (error2) {
    console.error('❌ Error:', error2);
  } else {
    console.log('✅ Registro creado con created_at especificado:');
    console.log('   ID:', testRequest2.id);
    console.log('   created_at (raw):', testRequest2.created_at);
    console.log('   created_at (Date):', new Date(testRequest2.created_at).toISOString());
    console.log('   Formateado a Chile:', new Date(testRequest2.created_at).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour12: false
    }));
  }

  console.log();

  // Comparar con Hugo Cerda
  console.log('='.repeat(80));
  console.log('📋 COMPARACIÓN CON HUGO CERDA:');
  console.log('='.repeat(80));

  const { data: hugoRequest, error: hugoError } = await supabase
    .from('photo_requests')
    .select('id, created_at, client_name')
    .ilike('client_name', '%hugo%cerda%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (hugoError) {
    console.error('❌ Error:', hugoError);
  } else {
    console.log('Cliente:', hugoRequest.client_name);
    console.log('created_at (raw):', hugoRequest.created_at);
    console.log('created_at (Date):', new Date(hugoRequest.created_at).toISOString());
    console.log('Formateado a Chile:', new Date(hugoRequest.created_at).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour12: false
    }));
  }

  console.log();

  // Limpiar registros de prueba
  console.log('🧹 Limpiando registros de prueba...');
  if (testRequest1) {
    await supabase.from('photo_requests').delete().eq('id', testRequest1.id);
  }
  if (testRequest2) {
    await supabase.from('photo_requests').delete().eq('id', testRequest2.id);
  }
  console.log('✅ Limpieza completada');
}

diagnoseTimestamp()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
