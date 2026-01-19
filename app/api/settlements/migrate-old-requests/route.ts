import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createTransactionDetails,
  getDefaultCommissionConfig,
  type CommissionConfig,
} from '@/lib/earningsCalculations';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/settlements/migrate-old-requests
 *
 * Migra solicitudes antiguas (pagadas pero sin transaction_details)
 * calculando los valores estimados basados en la configuración actual.
 *
 * EJECUTAR UNA SOLA VEZ para migrar datos históricos.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migración de solicitudes antiguas...');

    // Buscar solicitudes pagadas sin transaction_details
    const { data: oldRequests, error: fetchError } = await supabase
      .from('photo_requests')
      .select('id, photo_ids, gallery_id, created_at, client_name')
      .in('status', ['paid', 'delivered', 'expired'])
      .is('transaction_details', null);

    if (fetchError) {
      console.error('❌ Error fetching old requests:', fetchError);
      throw fetchError;
    }

    if (!oldRequests || oldRequests.length === 0) {
      console.log('✅ No hay solicitudes antiguas por migrar');
      return NextResponse.json({
        success: true,
        message: 'No hay solicitudes antiguas por migrar',
        migrated: 0,
      });
    }

    console.log(`📋 Encontradas ${oldRequests.length} solicitudes sin transaction_details`);

    const pricePerPhoto = parseInt(process.env.PRICE_PER_PHOTO || '2000');
    let migratedCount = 0;
    const results = [];

    for (const request of oldRequests) {
      try {
        const photoCount = request.photo_ids?.length || 0;

        if (photoCount === 0) {
          console.log(`⏭️  Saltando solicitud ${request.id} - sin fotos`);
          continue;
        }

        // Obtener configuración de comisiones de la galería
        const { data: gallery } = await supabase
          .from('galleries')
          .select('commission_config, photographer_id')
          .eq('id', request.gallery_id)
          .single();

        // Usar config de la galería o defaults
        let commissionConfig: CommissionConfig = getDefaultCommissionConfig();
        if (gallery?.commission_config) {
          commissionConfig = {
            ...commissionConfig,
            ...gallery.commission_config,
          };
        }

        // Calcular transaction_details (comisión de Flow será estimada)
        const transactionDetails = createTransactionDetails(
          photoCount,
          pricePerPhoto,
          null, // gatewayFee = null (será estimado)
          commissionConfig
        );

        // Marcar como estimado y migrado
        const transactionDetailsWithMeta = {
          ...transactionDetails,
          gateway_fee_estimated: true,
          migrated_at: new Date().toISOString(),
          migration_note: 'Calculado automáticamente para solicitud histórica',
        };

        // Actualizar solicitud
        const { error: updateError } = await supabase
          .from('photo_requests')
          .update({
            price_per_photo: pricePerPhoto,
            transaction_details: transactionDetailsWithMeta,
            settlement_status: 'pending',
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`❌ Error actualizando ${request.id}:`, updateError);
          results.push({
            id: request.id,
            client_name: request.client_name,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`✅ Migrada: ${request.client_name} - ${photoCount} fotos - $${transactionDetails.gross_amount}`);
          migratedCount++;
          results.push({
            id: request.id,
            client_name: request.client_name,
            photo_count: photoCount,
            gross_amount: transactionDetails.gross_amount,
            photographer_share: transactionDetails.photographer_share,
            director_share: transactionDetails.director_share,
            success: true,
          });
        }
      } catch (error: any) {
        console.error(`❌ Error procesando solicitud ${request.id}:`, error);
        results.push({
          id: request.id,
          client_name: request.client_name,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`✅ Migración completada: ${migratedCount}/${oldRequests.length} solicitudes`);

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${migratedCount} solicitudes actualizadas`,
      migrated: migratedCount,
      total: oldRequests.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error en la migración',
      },
      { status: 500 }
    );
  }
}
