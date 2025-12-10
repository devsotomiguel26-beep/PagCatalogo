import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getFlowPaymentStatus, FLOW_STATUS } from '@/lib/flowPayment';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-delivery-template';
import {
  generateDownloadLinks,
  markPhotosAsSent,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

/**
 * Sistema de respaldo para verificar pagos pendientes
 * Verifica en Flow si hay pagos completados que no se sincronizaron vía webhook
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando verificación de pagos pendientes...');

    // Obtener todas las solicitudes pendientes con flow_order
    const { data: pendingRequests, error } = await supabase
      .from('photo_requests')
      .select('*')
      .eq('status', 'pending')
      .not('flow_order', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo solicitudes pendientes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('✅ No hay solicitudes pendientes con flow_order');
      return NextResponse.json({
        success: true,
        message: 'No hay pagos pendientes para verificar',
        checked: 0,
        processed: 0,
      });
    }

    console.log(`📋 Encontradas ${pendingRequests.length} solicitudes pendientes con flow_order`);

    const results = [];
    let processedCount = 0;

    for (const req of pendingRequests) {
      try {
        console.log(`🔍 Verificando solicitud ${req.id} (Flow Order: ${req.flow_order})...`);

        // Verificar el estado del pago en Flow
        // Nota: Flow usa el commerceOrder (requestId) para consultar, no el flowOrder
        // Pero primero intentaremos con el token si lo tenemos guardado

        // Por ahora, saltamos la verificación automática porque necesitaríamos el token
        // que Flow envía en el webhook (no podemos obtenerlo solo con el flow_order)

        console.log(`⚠️ Solicitud ${req.id}: No se puede verificar automáticamente sin token de Flow`);
        results.push({
          requestId: req.id,
          flowOrder: req.flow_order,
          status: 'skipped',
          reason: 'Token de Flow no disponible para verificación',
        });

      } catch (err: any) {
        console.error(`❌ Error verificando solicitud ${req.id}:`, err);
        results.push({
          requestId: req.id,
          status: 'error',
          error: err.message,
        });
      }
    }

    console.log(`✅ Verificación completada. Procesados: ${processedCount}/${pendingRequests.length}`);

    return NextResponse.json({
      success: true,
      message: `Verificación completada`,
      checked: pendingRequests.length,
      processed: processedCount,
      results,
    });
  } catch (error: any) {
    console.error('❌ Error en verificación de pagos:', error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// GET para mostrar estado actual
export async function GET() {
  try {
    const { data: pendingRequests, error } = await supabase
      .from('photo_requests')
      .select('id, client_name, client_email, status, flow_order, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      pendingCount: pendingRequests?.length || 0,
      pending: pendingRequests,
      message: 'Solicitudes pendientes (últimas 10)',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
