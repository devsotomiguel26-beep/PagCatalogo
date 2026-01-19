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

async function findAllViews() {
  console.log('🔍 Buscando todas las vistas que podrían depender de photo_requests...\n');

  // Lista de vistas conocidas basadas en el código
  const knownViews = [
    'active_requests',
    'pending_earnings',
    'photographer_earnings_summary',
  ];

  console.log('='.repeat(80));
  console.log('📋 ANALIZANDO VISTAS CONOCIDAS:');
  console.log('='.repeat(80));
  console.log();

  const viewDefinitions = [];

  for (const viewName of knownViews) {
    console.log(`Vista: ${viewName}`);
    console.log('-'.repeat(80));

    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Error o no existe: ${error.message}`);
      } else {
        console.log(`✅ Vista existe`);

        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columnas (${columns.length}):`);
          columns.slice(0, 10).forEach(col => console.log(`   - ${col}`));
          if (columns.length > 10) {
            console.log(`   ... y ${columns.length - 10} más`);
          }

          // Verificar si tiene columnas timestamp
          const timestampColumns = columns.filter(col =>
            col.includes('date') ||
            col.includes('at') ||
            col === 'created_at' ||
            col === 'updated_at'
          );

          if (timestampColumns.length > 0) {
            console.log(`   ⚠️  Columnas timestamp: ${timestampColumns.join(', ')}`);
          }

          viewDefinitions.push({
            name: viewName,
            columns,
            exists: true
          });
        } else {
          console.log(`   ⚠️  Vista existe pero está vacía`);
          viewDefinitions.push({
            name: viewName,
            columns: [],
            exists: true,
            empty: true
          });
        }
      }
    } catch (err) {
      console.log(`❌ Error consultando: ${err.message}`);
    }

    console.log();
  }

  // Ahora inferir las definiciones
  console.log('='.repeat(80));
  console.log('🔧 DEFINICIONES INFERIDAS:');
  console.log('='.repeat(80));
  console.log();

  // 1. active_requests (ya la tenemos)
  console.log('-- Vista 1: active_requests');
  console.log(`CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE (is_archived IS NOT TRUE OR is_archived IS NULL)
  AND (is_test IS NOT TRUE OR is_test IS NULL)
  AND status NOT IN ('cancelled', 'abandoned');
`);

  // 2. pending_earnings (ya existe en el código)
  console.log('-- Vista 2: pending_earnings');
  console.log(`-- (Ya existe en supabase-fix-pending-earnings-view-v2.sql)
-- Ver archivo para definición completa
`);

  // 3. photographer_earnings_summary (necesitamos inferirla)
  console.log('-- Vista 3: photographer_earnings_summary');

  const summaryView = viewDefinitions.find(v => v.name === 'photographer_earnings_summary');
  if (summaryView && summaryView.exists) {
    console.log('-- Intentando obtener datos de ejemplo...');

    const { data: sampleData, error: sampleError } = await supabase
      .from('photographer_earnings_summary')
      .select('*')
      .limit(2);

    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('-- Columnas:', Object.keys(sampleData[0]).join(', '));
      console.log('-- Datos de ejemplo:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      console.log();

      // Inferir la definición basándonos en las columnas
      const cols = Object.keys(sampleData[0]);

      if (cols.includes('photographer_id') && cols.includes('total_earnings')) {
        console.log(`-- DEFINICIÓN INFERIDA:
CREATE OR REPLACE VIEW photographer_earnings_summary AS
SELECT
  g.photographer_id,
  p.name as photographer_name,
  COUNT(pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
  SUM((pr.transaction_details->>'photographer_share')::numeric) as total_earnings,
  MIN(pr.created_at) as first_sale,
  MAX(pr.created_at) as last_sale
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered')
  AND pr.transaction_details IS NOT NULL
  AND g.photographer_id IS NOT NULL
GROUP BY g.photographer_id, p.name;
`);
      }
    } else {
      console.log('-- ⚠️  No se pudo obtener datos de ejemplo');
      console.log('-- Crear definición manualmente basándose en el propósito de la vista');
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('📝 RESUMEN:');
  console.log('='.repeat(80));
  console.log(`
Vistas encontradas que dependen de photo_requests:
${viewDefinitions.map(v => `- ${v.name} ${v.exists ? '✅' : '❌'}`).join('\n')}

Para ejecutar el fix de timestamp, necesitas:
1. DROP todas estas vistas
2. ALTER la tabla photo_requests
3. Recrear todas las vistas

Archivo SQL v3 generándose...
  `);
}

findAllViews()
  .then(() => {
    console.log('\n✅ Búsqueda completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
