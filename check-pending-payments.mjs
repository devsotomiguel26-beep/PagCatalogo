import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICANDO PAGOS PENDIENTES Y POSIBLES PROBLEMAS DE WEBHOOK\n');
console.log('=' .repeat(80));

// 1. Buscar solicitudes en pending que tienen más de 1 hora
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const { data: pendingRequests, error } = await supabase
  .from('photo_requests')
  .select('*')
  .eq('status', 'pending')
  .lt('created_at', oneHourAgo)
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`\n📊 Solicitudes en PENDING con más de 1 hora: ${pendingRequests.length}\n`);

if (pendingRequests.length === 0) {
  console.log('✅ No hay solicitudes pendientes antiguas.');
  console.log('   Esto es bueno - significa que los webhooks están funcionando\n');
} else {
  console.log('⚠️  ATENCIÓN: Estas solicitudes pueden tener pagos no procesados:\n');

  for (const req of pendingRequests) {
    const hoursSince = Math.floor((Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60));

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📋 ${req.client_name} - ${req.child_name}`);
    console.log(`   Email: ${req.client_email}`);
    console.log(`   Creada: ${new Date(req.created_at).toLocaleString('es-CL')}`);
    console.log(`   Hace: ${hoursSince} hora(s)`);
    console.log(`   Fotos: ${req.photo_ids?.length || 0}`);
    console.log(`   ID: ${req.id}`);

    if (req.flow_order) {
      console.log(`   ✅ Flow Order: ${req.flow_order}`);
      console.log(`   ⚠️  EXTRAÑO: Tiene flow_order pero status=pending`);
    } else {
      console.log(`   ❌ Sin Flow Order`);
    }

    if (req.payment_data) {
      console.log(`   ✅ Tiene payment_data`);
      console.log(`   ⚠️  EXTRAÑO: Tiene payment_data pero status=pending`);
    } else {
      console.log(`   ❌ Sin payment_data`);
    }

    console.log('\n   💡 ACCIÓN RECOMENDADA:');
    if (!req.flow_order && !req.payment_data) {
      console.log(`   1. Verifica en Flow Dashboard si hay pago para ${req.client_email}`);
      console.log(`   2. Si SÍ hay pago: Webhook falló, actualizar manualmente`);
      console.log(`   3. Si NO hay pago: Cliente no completó el pago, esperar o contactar`);
    } else {
      console.log(`   1. Actualizar status manualmente a 'paid'`);
      console.log(`   2. Enviar fotos manualmente`);
    }
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// 2. Verificar solicitudes que tienen payment_data pero status no es paid
const { data: inconsistentRequests } = await supabase
  .from('photo_requests')
  .select('*')
  .not('payment_data', 'is', null)
  .neq('status', 'paid')
  .neq('status', 'delivered');

if (inconsistentRequests && inconsistentRequests.length > 0) {
  console.log(`\n🚨 INCONSISTENCIAS ENCONTRADAS: ${inconsistentRequests.length}\n`);
  console.log('   Solicitudes con payment_data pero status incorrecto:\n');

  for (const req of inconsistentRequests) {
    console.log(`   - ${req.client_name}: status=${req.status} (debería ser paid/delivered)`);
  }

  console.log('\n   💡 Estas solicitudes necesitan corrección manual\n');
}

// 3. Estadísticas generales
const { data: stats } = await supabase
  .from('photo_requests')
  .select('status');

if (stats) {
  const statusCount = stats.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 ESTADÍSTICAS GENERALES:\n');
  console.log(`   Total solicitudes: ${stats.length}`);
  Object.entries(statusCount).forEach(([status, count]) => {
    const emoji = {
      pending: '⏳',
      paid: '💰',
      delivered: '✅',
      expired: '⏰',
    }[status] || '❓';
    console.log(`   ${emoji} ${status}: ${count}`);
  });
}

// 4. Solicitudes recientes (últimas 24h)
const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { data: recentRequests } = await supabase
  .from('photo_requests')
  .select('status, created_at')
  .gte('created_at', last24h)
  .order('created_at', { ascending: false });

if (recentRequests) {
  console.log(`\n📅 ÚLTIMAS 24 HORAS: ${recentRequests.length} solicitudes`);
  const recentStatusCount = recentRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  Object.entries(recentStatusCount).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('\n💡 RECOMENDACIONES:\n');
console.log('1. Si hay muchas pending antiguas: Verificar webhook en Flow');
console.log('2. Si hay inconsistencias: Ejecutar scripts de corrección');
console.log('3. Monitorear cada hora durante las próximas 24h');
console.log('');
