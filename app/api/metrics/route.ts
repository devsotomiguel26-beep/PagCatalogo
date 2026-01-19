import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente Supabase con permisos de admin para server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para obtener métricas del dashboard
 * GET /api/metrics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo métricas del dashboard...');

    // 1. Estadísticas por estado (EXCLUYE solicitudes de prueba)
    const { data: statsByStatus, error: statsError } = await supabase
      .from('photo_requests')
      .select('status, photo_ids, created_at, is_test')
      .not('is_test', 'eq', true);

    if (statsError) {
      console.error('Error obteniendo stats:', statsError);
      throw statsError;
    }

    // Procesar estadísticas por estado
    const statusStats = {
      pending: { count: 0, photos: 0, revenue: 0 },
      paid: { count: 0, photos: 0, revenue: 0 },
      delivered: { count: 0, photos: 0, revenue: 0 },
      expired: { count: 0, photos: 0, revenue: 0 },
    };

    const pricePerPhoto = parseInt(process.env.PRICE_PER_PHOTO || '2000');
    let totalRevenue = 0;
    let totalPhotos = 0;

    statsByStatus?.forEach((request: any) => {
      const status = request.status as keyof typeof statusStats;
      const photoCount = request.photo_ids?.length || 0;
      const revenue = ['paid', 'delivered', 'expired'].includes(status)
        ? photoCount * pricePerPhoto
        : 0;

      if (statusStats[status]) {
        statusStats[status].count += 1;
        statusStats[status].photos += photoCount;
        statusStats[status].revenue += revenue;
      }

      if (['paid', 'delivered', 'expired'].includes(status)) {
        totalRevenue += revenue;
      }
      totalPhotos += photoCount;
    });

    // 2. Métricas de conversión
    const totalRequests = statsByStatus?.length || 0;
    const paidRequests =
      statusStats.paid.count + statusStats.delivered.count + statusStats.expired.count;
    const deliveredRequests = statusStats.delivered.count + statusStats.expired.count;

    const conversionRate = totalRequests > 0 ? (paidRequests / totalRequests) * 100 : 0;
    const deliveryRate = paidRequests > 0 ? (deliveredRequests / paidRequests) * 100 : 0;
    const avgOrderValue = paidRequests > 0 ? totalRevenue / paidRequests : 0;

    // 3. Actividad reciente (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRequests = statsByStatus?.filter(
      (r: any) => new Date(r.created_at) >= sevenDaysAgo
    );

    // Agrupar por día
    const dailyActivity = new Map<string, any>();
    recentRequests?.forEach((request: any) => {
      const date = new Date(request.created_at).toISOString().split('T')[0];
      if (!dailyActivity.has(date)) {
        dailyActivity.set(date, {
          date,
          total: 0,
          pending: 0,
          paid: 0,
          delivered: 0,
          revenue: 0,
        });
      }

      const day = dailyActivity.get(date);
      day.total += 1;
      day[request.status] = (day[request.status] || 0) + 1;

      if (['paid', 'delivered', 'expired'].includes(request.status)) {
        const photoCount = request.photo_ids?.length || 0;
        day.revenue += photoCount * pricePerPhoto;
      }
    });

    // Convertir a array y ordenar por fecha
    const dailyActivityArray = Array.from(dailyActivity.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 4. Alertas y notificaciones
    const alerts = [];

    // Alerta de enlaces por expirar (próximos 2 días) - EXCLUYE solicitudes de prueba
    const { data: expiringRequests, error: expiringError } = await supabase
      .from('photo_requests')
      .select('id, client_name, download_links_expires_at, is_test')
      .eq('status', 'delivered')
      .not('is_test', 'eq', true)
      .gte('download_links_expires_at', new Date().toISOString())
      .lte('download_links_expires_at', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString());

    if (!expiringError && expiringRequests && expiringRequests.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Enlaces por expirar',
        message: `${expiringRequests.length} ${
          expiringRequests.length === 1 ? 'solicitud tiene' : 'solicitudes tienen'
        } enlaces que expirarán en los próximos 2 días`,
        count: expiringRequests.length,
      });
    }

    // Alerta de solicitudes pendientes de pago
    if (statusStats.pending.count > 0) {
      alerts.push({
        type: 'info',
        title: 'Pendientes de pago',
        message: `${statusStats.pending.count} ${
          statusStats.pending.count === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'
        } de pago`,
        count: statusStats.pending.count,
      });
    }

    // Alerta de enlaces expirados
    if (statusStats.expired.count > 0) {
      alerts.push({
        type: 'error',
        title: 'Enlaces expirados',
        message: `${statusStats.expired.count} ${
          statusStats.expired.count === 1 ? 'solicitud tiene' : 'solicitudes tienen'
        } enlaces expirados que pueden necesitar reenvío`,
        count: statusStats.expired.count,
      });
    }

    // 5. Top métricas
    const topMetrics = {
      totalRequests,
      totalRevenue,
      totalPhotos,
      avgOrderValue,
      conversionRate,
      deliveryRate,
      requestsLast7Days: recentRequests?.length || 0,
    };

    console.log('✅ Métricas obtenidas exitosamente');

    return NextResponse.json({
      success: true,
      data: {
        statusStats,
        topMetrics,
        dailyActivity: dailyActivityArray,
        alerts,
      },
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo métricas:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error obteniendo métricas',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
