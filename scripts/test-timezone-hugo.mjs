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

async function testTimezone() {
  console.log('🔍 Verificando zona horaria para Hugo Cerda...\n');

  // Buscar solicitud de Hugo Cerda
  const { data: requests, error } = await supabase
    .from('photo_requests')
    .select('id, client_name, created_at')
    .ilike('client_name', '%hugo%cerda%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('❌ No se encontró solicitud de Hugo Cerda');
    return;
  }

  const request = requests[0];
  console.log('📋 Solicitud encontrada:');
  console.log('Cliente:', request.client_name);
  console.log('Fecha raw (UTC):', request.created_at);
  console.log();

  const date = new Date(request.created_at);

  console.log('🌍 Hora UTC (como está en BD):');
  console.log('   ', date.toISOString());
  console.log();

  console.log('🇨🇱 Formatos para Chile:');
  console.log();

  // Formato actual (12 horas)
  console.log('❌ ACTUAL (12 horas):');
  console.log('   ', date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  }));
  console.log();

  // Formato correcto (24 horas)
  console.log('✅ CORRECTO (24 horas):');
  console.log('   ', date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  }));
  console.log();

  // Fecha completa
  console.log('📅 Fecha completa:');
  console.log('   ', date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }));
  console.log();

  // Fecha y hora juntas
  console.log('📅 Fecha + Hora (formato completo):');
  console.log('   ', date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  }));
  console.log();

  // Verificar diferencia de horas
  const utcHour = date.getUTCHours();
  const chileDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const chileHour = chileDate.getHours();

  console.log('⏰ Comparación de horas:');
  console.log(`   UTC: ${utcHour}:${date.getUTCMinutes().toString().padStart(2, '0')}`);
  console.log(`   Chile: ${chileHour}:${chileDate.getMinutes().toString().padStart(2, '0')}`);
  console.log(`   Diferencia: ${utcHour - chileHour} horas`);
}

testTimezone()
  .then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
