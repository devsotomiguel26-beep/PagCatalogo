import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/reportes/ventas
 * Obtiene reporte de ventas con filtros
 *
 * Query params:
 * - fecha_inicio: fecha inicio (YYYY-MM-DD)
 * - fecha_fin: fecha fin (YYYY-MM-DD)
 * - fotografo_id: filtrar por fotógrafo específico
 * - estado_liquidacion: pending|settled|all
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');
    const fotografoId = searchParams.get('fotografo_id');
    const estadoLiquidacion = searchParams.get('estado_liquidacion') || 'all';

    console.log('🔍 Generando reporte de ventas...');
    console.log('   Fecha inicio:', fechaInicio);
    console.log('   Fecha fin:', fechaFin);
    console.log('   Fotógrafo:', fotografoId || 'todos');
    console.log('   Estado liquidación:', estadoLiquidacion);

    // Construir query base
    let query = supabase
      .from('photo_requests')
      .select(`
        id,
        client_name,
        client_email,
        photo_ids,
        price_per_photo,
        status,
        settlement_status,
        payment_date,
        created_at,
        flow_order,
        transaction_details,
        payment_data,
        is_test,
        galleries (
          id,
          title,
          slug,
          photographer_id,
          photographers (
            id,
            name,
            email
          )
        )
      `)
      .in('status', ['paid', 'delivered', 'expired'])
      .not('is_test', 'eq', true)
      .order('payment_date', { ascending: false });

    // Filtro por rango de fechas (usando payment_date)
    if (fechaInicio) {
      query = query.gte('payment_date', `${fechaInicio}T00:00:00Z`);
    }
    if (fechaFin) {
      query = query.lte('payment_date', `${fechaFin}T23:59:59.999Z`);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo solicitudes:', error);
      throw error;
    }

    console.log(`✅ ${requests?.length || 0} solicitudes encontradas`);

    // Filtrar por fotógrafo en memoria (si se especificó)
    let filteredRequests = requests || [];
    if (fotografoId && fotografoId !== 'all') {
      filteredRequests = filteredRequests.filter(
        req => req.galleries?.photographer_id === fotografoId
      );
    }

    // Filtrar por estado de liquidación
    if (estadoLiquidacion !== 'all') {
      filteredRequests = filteredRequests.filter(
        req => req.settlement_status === estadoLiquidacion
      );
    }

    // Transformar datos para la tabla
    const reportData = filteredRequests.map(req => {
      const td = req.transaction_details || {};
      const photoCount = req.photo_ids?.length || 0;

      // Soportar ambas estructuras de transaction_details
      const grossAmount = parseFloat(td.gross_amount || 0);
      const gatewayFee = parseFloat(td.gateway_fee || 0);
      const netAmount = parseFloat(td.net_amount || 0);

      const photographerShare = parseFloat(
        td.photographer_share || td.breakdown?.photographer_share || 0
      );
      const directorShare = parseFloat(
        td.director_share || td.breakdown?.director_share || 0
      );
      const photographerPct = parseFloat(
        td.photographer_percentage || td.breakdown?.photographer_percentage || 0
      );
      const directorPct = parseFloat(
        td.director_percentage || td.breakdown?.director_percentage || 0
      );

      // Verificaciones de integridad
      const sumCheck = Math.abs((photographerShare + directorShare) - netAmount) < 0.01;
      const pctCheck = Math.abs((photographerPct + directorPct) - 100) < 0.01;
      const grossCheck = Math.abs((netAmount + gatewayFee) - grossAmount) < 0.01;

      // Estado de depósito de Flow
      let flowDepositStatus = null;
      let flowTransferDate = null;

      if (req.payment_data?.paymentData?.transferDate) {
        const transferDate = new Date(req.payment_data.paymentData.transferDate);
        const now = new Date();

        flowTransferDate = transferDate.toISOString();

        if (transferDate <= now) {
          flowDepositStatus = 'depositado';
        } else {
          flowDepositStatus = 'por_depositar';
        }
      }

      return {
        id: req.id,
        payment_date: req.payment_date,
        created_at: req.created_at,
        client_name: req.client_name,
        client_email: req.client_email,
        gallery_title: req.galleries?.title || 'N/A',
        gallery_slug: req.galleries?.slug,
        photographer_id: req.galleries?.photographer_id,
        photographer_name: req.galleries?.photographers?.name || 'Sin asignar (Director)',
        photographer_email: req.galleries?.photographers?.email,
        photo_count: photoCount,
        price_per_photo: req.price_per_photo,
        gross_amount: grossAmount,
        gateway_fee: gatewayFee,
        gateway_fee_pct: gatewayFee > 0 ? (gatewayFee / grossAmount * 100) : 0,
        net_amount: netAmount,
        photographer_share: photographerShare,
        photographer_pct: photographerPct,
        director_share: directorShare,
        director_pct: directorPct,
        settlement_status: req.settlement_status,
        flow_order: req.flow_order,
        flow_deposit_status: flowDepositStatus,
        flow_transfer_date: flowTransferDate,
        status: req.status,
        // Banderas de verificación
        sum_check: sumCheck,
        pct_check: pctCheck,
        gross_check: grossCheck,
        all_checks_pass: sumCheck && pctCheck && grossCheck,
        has_transaction_details: !!req.transaction_details,
      };
    });

    // Calcular totales
    const totals = reportData.reduce(
      (acc, item) => ({
        total_requests: acc.total_requests + 1,
        total_photos: acc.total_photos + item.photo_count,
        total_gross: acc.total_gross + item.gross_amount,
        total_gateway_fee: acc.total_gateway_fee + item.gateway_fee,
        total_net: acc.total_net + item.net_amount,
        total_photographer: acc.total_photographer + item.photographer_share,
        total_director: acc.total_director + item.director_share,
        pending_liquidation: acc.pending_liquidation + (item.settlement_status === 'pending' ? 1 : 0),
        settled: acc.settled + (item.settlement_status === 'settled' ? 1 : 0),
      }),
      {
        total_requests: 0,
        total_photos: 0,
        total_gross: 0,
        total_gateway_fee: 0,
        total_net: 0,
        total_photographer: 0,
        total_director: 0,
        pending_liquidation: 0,
        settled: 0,
      }
    );

    // Calcular porcentajes promedio
    const avgPhotographerPct = totals.total_net > 0
      ? (totals.total_photographer / totals.total_net * 100)
      : 0;
    const avgDirectorPct = totals.total_net > 0
      ? (totals.total_director / totals.total_net * 100)
      : 0;
    const avgGatewayPct = totals.total_gross > 0
      ? (totals.total_gateway_fee / totals.total_gross * 100)
      : 0;

    console.log('✅ Reporte generado exitosamente');
    console.log(`   ${totals.total_requests} solicitudes, ${totals.total_photos} fotos`);
    console.log(`   Total neto: $${totals.total_net.toLocaleString()}`);

    return NextResponse.json({
      success: true,
      data: reportData,
      totals: {
        ...totals,
        avg_photographer_pct: avgPhotographerPct,
        avg_director_pct: avgDirectorPct,
        avg_gateway_pct: avgGatewayPct,
      },
      filters_applied: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        fotografo_id: fotografoId,
        estado_liquidacion: estadoLiquidacion,
      },
    });
  } catch (error: any) {
    console.error('❌ Error en GET /api/reportes/ventas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error generando reporte',
      },
      { status: 500 }
    );
  }
}
