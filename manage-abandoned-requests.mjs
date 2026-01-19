import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HOURS_UNTIL_ABANDONED = 48;

console.log('🧹 GESTIÓN DE SOLICITUDES ABANDONADAS\n');
console.log('='.repeat(80));

// Modo: 'check' o 'execute'
const mode = process.argv[2] || 'check';

if (mode !== 'check' && mode !== 'execute') {
  console.error('❌ Uso: node manage-abandoned-requests.mjs [check|execute]');
  console.error('   check   - Ver qué se marcaría como abandonado (sin cambios)');
  console.error('   execute - Marcar solicitudes como abandonadas');
  process.exit(1);
}

// 1. Buscar solicitudes pending viejas
const cutoffDate = new Date(Date.now() - HOURS_UNTIL_ABANDONED * 60 * 60 * 1000).toISOString();

const { data: oldPending, error } = await supabase
  .from('photo_requests')
  .select('*')
  .eq('status', 'pending')
  .lt('created_at', cutoffDate)
  .eq('is_test', false)
  .order('created_at', { ascending: true });

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`\n📊 Solicitudes pending con más de ${HOURS_UNTIL_ABANDONED}h: ${oldPending.length}\n`);

if (oldPending.length === 0) {
  console.log('✅ No hay solicitudes para marcar como abandonadas\n');
  process.exit(0);
}

// 2. Mostrar detalles
console.log('📋 DETALLES:\n');

for (const req of oldPending) {
  const hoursSince = Math.floor((Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60));

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`ID: ${req.id}`);
  console.log(`Cliente: ${req.client_name} (${req.client_email})`);
  console.log(`Niño/a: ${req.child_name}`);
  console.log(`Fotos: ${req.photo_ids?.length || 0}`);
  console.log(`Creada: ${new Date(req.created_at).toLocaleString('es-CL')}`);
  console.log(`Hace: ${hoursSince} horas (${Math.floor(hoursSince / 24)} días)`);

  if (req.flow_order) {
    console.log(`⚠️  Tiene Flow Order: ${req.flow_order} (webhook puede haber fallado)`);
  }
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// 3. Modo check vs execute
if (mode === 'check') {
  console.log(`\n🔍 MODO CHECK - No se realizarán cambios\n`);
  console.log(`Para marcar estas ${oldPending.length} solicitudes como abandonadas, ejecuta:`);
  console.log(`   node manage-abandoned-requests.mjs execute\n`);

} else if (mode === 'execute') {
  console.log(`\n⚠️  MODO EXECUTE - Marcando ${oldPending.length} solicitudes como abandonadas...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const req of oldPending) {
    // Verificar si tiene flow_order (posible pago)
    const reason = req.flow_order
      ? 'No se completó el proceso de pago (posible webhook fallido)'
      : 'No se completó el pago en 48 horas';

    const { error: updateError } = await supabase
      .from('photo_requests')
      .update({
        status: 'abandoned',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'system',
        cancel_reason: reason,
      })
      .eq('id', req.id);

    if (updateError) {
      console.log(`❌ Error en ${req.client_name}: ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`✅ ${req.client_name} → abandoned`);
      successCount++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 RESUMEN:`);
  console.log(`   Total procesadas: ${oldPending.length}`);
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}\n`);

  if (successCount > 0) {
    console.log('✅ Solicitudes marcadas como abandonadas correctamente');
    console.log('   No aparecerán en el listado principal (filtro por defecto)');
    console.log('   Puedes verlas en Admin → Solicitudes → Filtro "Abandonadas"\n');
  }
}

// 4. Estadísticas generales
const { data: stats } = await supabase
  .from('photo_requests')
  .select('status, is_test');

if (stats) {
  const statusCount = stats.reduce((acc, req) => {
    const key = req.is_test ? `${req.status} (test)` : req.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 ESTADÍSTICAS ACTUALES:\n');
  Object.entries(statusCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const emoji = {
        pending: '⏳',
        paid: '💰',
        delivered: '✅',
        expired: '⏰',
        abandoned: '🗑️',
        cancelled: '❌',
      };
      const statusKey = status.replace(' (test)', '');
      const icon = emoji[statusKey] || '❓';
      console.log(`   ${icon} ${status}: ${count}`);
    });

  console.log('');
}

console.log('='.repeat(80));
