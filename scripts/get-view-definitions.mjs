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

async function getViewDefinitions() {
  console.log('🔍 Obteniendo definiciones de vistas que dependen de photo_requests...\n');

  // Intentar obtener definición de la vista usando información del catálogo
  console.log('='.repeat(80));
  console.log('📋 VISTA: active_requests');
  console.log('='.repeat(80));

  // Método 1: Intentar SELECT para ver qué columnas tiene
  console.log('\n1️⃣ Estructura de la vista (columnas):');
  const { data: viewData, error: viewError } = await supabase
    .from('active_requests')
    .select('*')
    .limit(1);

  if (viewError) {
    console.error('❌ Error consultando vista:', viewError.message);
  } else if (viewData && viewData.length > 0) {
    console.log('✅ Columnas de active_requests:');
    const columns = Object.keys(viewData[0]);
    columns.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  Vista existe pero está vacía');
  }

  console.log('\n2️⃣ Datos de ejemplo (primera fila):');
  if (viewData && viewData.length > 0) {
    const firstRow = viewData[0];
    console.log(JSON.stringify(firstRow, null, 2));
  }

  // Método 2: Comparar con photo_requests directamente
  console.log('\n3️⃣ Comparando con photo_requests:');
  const { data: tableData, error: tableError } = await supabase
    .from('photo_requests')
    .select('*')
    .limit(1);

  if (!tableError && tableData && tableData.length > 0) {
    const tableColumns = Object.keys(tableData[0]);
    const viewColumns = viewData && viewData.length > 0 ? Object.keys(viewData[0]) : [];

    console.log('\n✅ active_requests parece ser un SELECT * FROM photo_requests');
    console.log('   con algún filtro WHERE');

    if (JSON.stringify(tableColumns.sort()) === JSON.stringify(viewColumns.sort())) {
      console.log('\n✓ Las columnas son idénticas');
    }
  }

  // Método 3: Contar registros para inferir el filtro
  console.log('\n4️⃣ Contando registros para inferir filtro:');

  const { count: totalCount } = await supabase
    .from('photo_requests')
    .select('*', { count: 'exact', head: true });

  const { count: viewCount } = await supabase
    .from('active_requests')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total en photo_requests: ${totalCount}`);
  console.log(`   Total en active_requests: ${viewCount}`);
  console.log(`   Diferencia: ${(totalCount || 0) - (viewCount || 0)} registros filtrados`);

  // Método 4: Verificar qué registros NO están en la vista
  console.log('\n5️⃣ Analizando qué se filtra:');

  const { data: allRequests } = await supabase
    .from('photo_requests')
    .select('id, status, is_test, is_archived')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: activeRequestsIds } = await supabase
    .from('active_requests')
    .select('id')
    .limit(100);

  if (allRequests && activeRequestsIds) {
    const activeIds = new Set(activeRequestsIds.map(r => r.id));
    const filtered = allRequests.filter(r => !activeIds.has(r.id));

    if (filtered.length > 0) {
      console.log('\n✅ Registros EXCLUIDOS de active_requests:');
      filtered.forEach(r => {
        console.log(`   - Status: ${r.status}, is_test: ${r.is_test}, is_archived: ${r.is_archived}`);
      });

      // Inferir el filtro
      const testCount = filtered.filter(r => r.is_test === true).length;
      const archivedCount = filtered.filter(r => r.is_archived === true).length;
      const cancelledCount = filtered.filter(r => r.status === 'cancelled').length;
      const abandonedCount = filtered.filter(r => r.status === 'abandoned').length;

      console.log('\n📊 Análisis de exclusiones:');
      console.log(`   - is_test = true: ${testCount}`);
      console.log(`   - is_archived = true: ${archivedCount}`);
      console.log(`   - status = 'cancelled': ${cancelledCount}`);
      console.log(`   - status = 'abandoned': ${abandonedCount}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 DEFINICIÓN INFERIDA:');
  console.log('='.repeat(80));
  console.log(`
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE (is_archived IS NOT TRUE OR is_archived IS NULL)
  AND (is_test IS NOT TRUE OR is_test IS NULL)
  AND status NOT IN ('cancelled', 'abandoned');
  `);
}

getViewDefinitions()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
