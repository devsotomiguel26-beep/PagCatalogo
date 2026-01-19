import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPendingEarningsView() {
  console.log('🔧 Corrigiendo vista pending_earnings...\n');

  const sql = `
-- Eliminar vista existente
DROP VIEW IF EXISTS pending_earnings CASCADE;

-- Recrear vista con estructura correcta
CREATE OR REPLACE VIEW pending_earnings AS
SELECT
  pr.id as request_id,
  g.id as gallery_id,
  g.title as gallery_title,
  g.slug as gallery_slug,
  p.id as photographer_id,
  p.name as photographer_name,
  pr.client_name,
  pr.client_email,
  pr.status as request_status,
  pr.settlement_status,
  pr.created_at as request_date,
  ARRAY_LENGTH(pr.photo_ids, 1) as photo_count,
  pr.price_per_photo,
  (pr.transaction_details->>'gross_amount')::numeric as gross_amount,
  (pr.transaction_details->>'gateway_fee')::numeric as gateway_fee,
  (pr.transaction_details->>'net_amount')::numeric as net_amount,
  (pr.transaction_details->>'photographer_share')::numeric as photographer_share,
  (pr.transaction_details->>'director_share')::numeric as director_share,
  (pr.transaction_details->>'photographer_percentage')::numeric as photographer_pct,
  (pr.transaction_details->>'director_percentage')::numeric as director_pct
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.settlement_status != 'settled'
  AND pr.transaction_details IS NOT NULL
ORDER BY pr.created_at DESC;
  `.trim();

  try {
    // Intentar ejecutar con rpc (puede no funcionar con DDL)
    console.log('Ejecutando SQL...');

    // Supabase no permite ejecutar DDL directamente desde el cliente JS
    // Necesitamos usar el Dashboard o ejecutar manualmente
    console.log('⚠️  NOTA: Supabase JS client no puede ejecutar DDL (CREATE VIEW)');
    console.log('⚠️  Debes ejecutar el SQL manualmente en el Dashboard de Supabase\n');
    console.log('📋 SQL a ejecutar:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('\n📍 Pasos:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/editor');
    console.log('2. Copia el SQL de arriba');
    console.log('3. Pégalo en el editor SQL');
    console.log('4. Click en "Run"');
    console.log('\n✅ Después de ejecutar, intenta crear la liquidación nuevamente\n');

    // Guardar SQL en archivo
    fs.writeFileSync('supabase-fix-pending-earnings-view.sql', sql);
    console.log('💾 SQL guardado en: supabase-fix-pending-earnings-view.sql\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPendingEarningsView()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
