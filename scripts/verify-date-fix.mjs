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

async function verifyDateFix() {
  console.log('🔍 Verificando que el fix de fechas funciona correctamente...\n');

  const photographerId = '113363b3-4be8-48e5-b733-c48407d3fc01'; // Alejandro Dubó
  const period_start = '2026-01-15';
  const period_end = '2026-01-19';

  // Simular lo que ahora hace el endpoint (con el fix)
  const periodEndAdjusted = period_end.includes('T')
    ? period_end
    : `${period_end}T23:59:59.999Z`;

  console.log('📅 Rango de fechas:');
  console.log(`   Inicio: ${period_start}`);
  console.log(`   Fin (original): ${period_end}`);
  console.log(`   Fin (ajustado): ${periodEndAdjusted}`);
  console.log();

  // Query con el fix
  const { data: pendingEarnings, error } = await supabase
    .from('pending_earnings')
    .select('*')
    .gte('request_date', period_start)
    .lte('request_date', periodEndAdjusted)
    .eq('photographer_id', photographerId)
    .order('request_date', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Resultados: ${pendingEarnings.length} solicitud(es) encontradas\n`);

  // Verificar que Alex Beiza está incluido
  const alexBeiza = pendingEarnings.find(e => e.client_name.toLowerCase().includes('alex'));

  if (alexBeiza) {
    console.log('✅ SUCCESS: Alex Beiza SÍ aparece en los resultados');
    console.log(`   Cliente: ${alexBeiza.client_name}`);
    console.log(`   Fecha: ${alexBeiza.request_date}`);
    console.log(`   Fotos: ${alexBeiza.photo_count}`);
    console.log(`   Monto: $${alexBeiza.photographer_share}`);
  } else {
    console.log('❌ ERROR: Alex Beiza NO aparece en los resultados');
  }

  console.log('\n📋 Todas las solicitudes encontradas:');
  for (const earning of pendingEarnings) {
    console.log(`   - ${earning.client_name} | ${earning.request_date} | ${earning.photo_count} fotos | $${earning.photographer_share}`);
  }
}

verifyDateFix()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
