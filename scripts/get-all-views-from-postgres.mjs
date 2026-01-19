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

async function getAllViews() {
  console.log('🔍 Consultando catálogo de PostgreSQL para encontrar TODAS las vistas...\n');

  // Lista de vistas conocidas del sistema
  const knownViews = [
    'active_requests',
    'pending_earnings',
    'photographer_earnings_summary',
    'director_earnings_summary',
    'settlements_detail',
    'adjustments_history',
    'production_requests', // Nueva
  ];

  console.log('='.repeat(80));
  console.log('📋 PROBANDO VISTAS CONOCIDAS:');
  console.log('='.repeat(80));
  console.log();

  const existingViews = [];

  for (const viewName of knownViews) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(0); // No necesitamos datos, solo verificar si existe

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${viewName} - NO EXISTE`);
        } else {
          console.log(`⚠️  ${viewName} - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${viewName} - EXISTE`);
        existingViews.push(viewName);
      }
    } catch (err) {
      console.log(`❌ ${viewName} - Error: ${err.message}`);
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log('='.repeat(80));
  console.log(`Total de vistas existentes: ${existingViews.length}`);
  console.log();
  console.log('Vistas encontradas:');
  existingViews.forEach((v, i) => console.log(`${i + 1}. ${v}`));

  console.log();
  console.log('='.repeat(80));
  console.log('💡 RECOMENDACIÓN PARA SQL v5:');
  console.log('='.repeat(80));
  console.log();
  console.log('DROP VIEW IF EXISTS ' + existingViews.join(' CASCADE;\nDROP VIEW IF EXISTS ') + ' CASCADE;');
  console.log();
  console.log('Total de vistas a eliminar:', existingViews.length);

  // Ahora buscar otras posibles vistas relacionadas
  console.log();
  console.log('='.repeat(80));
  console.log('🔍 BUSCANDO OTRAS VISTAS POSIBLES:');
  console.log('='.repeat(80));
  console.log();

  const possibleViews = [
    'all_requests',
    'archived_requests',
    'test_requests',
    'cancelled_requests',
    'expired_requests',
    'delivered_requests',
    'paid_requests',
  ];

  for (const viewName of possibleViews) {
    try {
      const { error } = await supabase
        .from(viewName)
        .select('*')
        .limit(0);

      if (!error) {
        console.log(`✅ ENCONTRADA NUEVA VISTA: ${viewName}`);
        existingViews.push(viewName);
      }
    } catch (err) {
      // Vista no existe, ok
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('📝 LISTA FINAL DE VISTAS:');
  console.log('='.repeat(80));
  console.log();
  existingViews.forEach((v, i) => console.log(`${i + 1}. ${v}`));
  console.log();
  console.log(`TOTAL: ${existingViews.length} vistas`);

  return existingViews;
}

getAllViews()
  .then((views) => {
    console.log('\n✅ Búsqueda completada');
    console.log(`\n📋 Usar estas ${views.length} vistas en SQL v5`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
