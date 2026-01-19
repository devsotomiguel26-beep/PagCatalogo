import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/fix-pending-earnings
 *
 * Corrige la vista pending_earnings que estaba leyendo mal
 * la estructura del JSON transaction_details
 *
 * EJECUTAR UNA VEZ para corregir el bug
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Corrigiendo vista pending_earnings...');

    // El SQL completo para recrear la vista
    const dropViewSQL = 'DROP VIEW IF EXISTS pending_earnings CASCADE;';

    const createViewSQL = `
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

    // Intentar ejecutar DROP
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropViewSQL
    });

    if (dropError) {
      console.log('⚠️  No se pudo eliminar vista (puede que no exista o no tengamos permiso):', dropError.message);
    }

    // Intentar ejecutar CREATE
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createViewSQL
    });

    if (createError) {
      console.error('❌ Error creando vista:', createError);

      // Si falla por falta de función exec_sql, dar instrucciones manuales
      if (createError.message.includes('function') || createError.message.includes('exec_sql')) {
        return NextResponse.json({
          success: false,
          error: 'No se puede ejecutar DDL desde la API',
          instructions: {
            message: 'Debes ejecutar el SQL manualmente en el Dashboard de Supabase',
            steps: [
              '1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/editor',
              '2. Abre el SQL Editor',
              '3. Copia y pega el SQL del campo "sql" abajo',
              '4. Click en "Run"',
            ],
            sql: dropViewSQL + '\n\n' + createViewSQL,
          },
        });
      }

      throw createError;
    }

    console.log('✅ Vista corregida exitosamente');

    // Verificar que funciona
    const { data: testData, error: testError } = await supabase
      .from('pending_earnings')
      .select('client_name, photo_count, photographer_share, director_share')
      .limit(1);

    if (testError) {
      console.error('⚠️  Error verificando vista:', testError);
    } else {
      console.log('✅ Vista funcionando correctamente');
    }

    return NextResponse.json({
      success: true,
      message: 'Vista pending_earnings corregida exitosamente',
      test_data: testData,
    });
  } catch (error: any) {
    console.error('❌ Error en fix-pending-earnings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error corrigiendo la vista',
        instructions: {
          message: 'Si el error persiste, ejecuta el SQL manualmente',
          file: 'supabase-fix-pending-earnings-view.sql',
        },
      },
      { status: 500 }
    );
  }
}
