import crypto from 'crypto';

/**
 * Consulta el estado de un pago en Flow
 * @param token - Token de Flow (NO el flowOrder)
 * @returns Estado del pago con información de depósito
 */
export async function getFlowPaymentStatus(token: string) {
  try {
    // Usar credenciales de producción
    const apiKey = process.env.FLOW_PRODUCTION_API_KEY!;
    const secretKey = process.env.FLOW_PRODUCTION_SECRET_KEY!;

    if (!apiKey || !secretKey) {
      console.error('❌ Flow credentials not configured');
      return null;
    }

    // Construir parámetros (ordenados alfabéticamente para la firma)
    const params: Record<string, string> = {
      apiKey: apiKey,
      token: token,
    };

    // Crear string para firma: concatenar "key=value&key=value"
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Crear firma HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(paramString)
      .digest('hex');

    // Construir URL con parámetros
    const url = new URL('https://www.flow.cl/api/payment/getStatus');
    url.searchParams.append('apiKey', apiKey);
    url.searchParams.append('token', token);
    url.searchParams.append('s', signature);

    // Hacer request a Flow
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Flow API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();

    // Flow retorna el campo "status" que indica el estado del pago
    // status: 1 = Pendiente, 2 = Pagado, 3 = Rechazado, 4 = Anulado
    // Y el campo "pending_info" con información del depósito si existe

    return {
      flowOrder: data.flowOrder,
      status: data.status, // 1=pending, 2=paid, 3=rejected, 4=cancelled
      amount: data.amount,
      payer: data.payer,
      paymentDate: data.paymentDate,
      // pending_info contiene información sobre el estado del depósito
      // pending_info.status: 1 = Por depositar, 2 = Depositado
      depositStatus: data.pending_info?.status,
      transferDate: data.pending_info?.date,
      raw: data, // Incluir respuesta completa por si necesitamos otros campos
    };
  } catch (error) {
    console.error('❌ Error calling Flow API:', error);
    return null;
  }
}

/**
 * Obtiene el estado del depósito de múltiples órdenes de Flow
 * @param requests - Array de objetos con { flowOrder, token? }
 * @returns Map de flowOrder -> estado del depósito
 */
export async function getBatchFlowDepositStatus(
  requests: Array<{ flowOrder: number | string; token?: string | null }>
): Promise<Map<string, 'depositado' | 'por_depositar' | null>> {
  const results = new Map<string, 'depositado' | 'por_depositar' | null>();

  // Consultar estados en paralelo (máximo 10 a la vez para no sobrecargar)
  const batchSize = 10;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);

    const promises = batch.map(async (request) => {
      const { flowOrder, token } = request;

      // Si no hay token, no podemos consultar Flow API (datos históricos)
      if (!token) {
        console.warn(`⚠️ No token available for flowOrder ${flowOrder} - skipping`);
        return { flowOrder: flowOrder.toString(), depositStatus: null };
      }

      try {
        const status = await getFlowPaymentStatus(token);

        if (!status) {
          return { flowOrder: flowOrder.toString(), depositStatus: null };
        }

        // pending_info.status: 1 = Por depositar, 2 = Depositado
        let depositStatus: 'depositado' | 'por_depositar' | null = null;

        if (status.depositStatus === 2) {
          depositStatus = 'depositado';
        } else if (status.depositStatus === 1) {
          depositStatus = 'por_depositar';
        }

        return { flowOrder: flowOrder.toString(), depositStatus };
      } catch (error) {
        console.error(`❌ Error querying Flow API for order ${flowOrder}:`, error);
        return { flowOrder: flowOrder.toString(), depositStatus: null };
      }
    });

    const batchResults = await Promise.all(promises);

    batchResults.forEach(({ flowOrder, depositStatus }) => {
      results.set(flowOrder, depositStatus);
    });

    // Pequeña pausa entre batches para evitar rate limiting
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
