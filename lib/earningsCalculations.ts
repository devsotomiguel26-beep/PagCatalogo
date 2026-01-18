/**
 * Cálculos de distribución de ganancias
 *
 * Este módulo calcula cómo se distribuyen los ingresos entre:
 * - Fotógrafo
 * - Director de la academia
 *
 * Teniendo en cuenta:
 * - Comisión de la pasarela de pago (Flow)
 * - Porcentajes configurables por galería
 */

export interface CommissionConfig {
  photographer_percentage: number;
  director_percentage: number;
  payment_gateway_fee_percentage: number;
  config_created_at?: string | null;
}

export interface EarningsBreakdown {
  gross_amount: number;
  gateway_fee: number;
  gateway_fee_estimated: boolean;
  net_amount: number;
  photographer_share: number;
  director_share: number;
  photographer_percentage: number;
  director_percentage: number;
  calculated_at: string;
}

export interface TransactionDetails extends EarningsBreakdown {
  price_per_photo: number;
  photo_count: number;
  flow_order?: number;
  commission_snapshot: CommissionConfig;
}

/**
 * Obtiene la configuración de comisiones por defecto desde variables de entorno
 */
export function getDefaultCommissionConfig(): CommissionConfig {
  return {
    photographer_percentage: parseInt(process.env.DEFAULT_PHOTOGRAPHER_PERCENTAGE || '80'),
    director_percentage: parseInt(process.env.DEFAULT_DIRECTOR_PERCENTAGE || '20'),
    payment_gateway_fee_percentage: parseFloat(process.env.DEFAULT_PAYMENT_GATEWAY_FEE_PERCENTAGE || '3.5'),
  };
}

/**
 * Calcula la distribución de ganancias
 *
 * @param grossAmount - Monto total pagado por el cliente
 * @param gatewayFee - Comisión real cobrada por Flow (si está disponible)
 * @param config - Configuración de comisiones de la galería
 * @returns Desglose completo de la distribución
 */
export function calculateEarningsBreakdown(
  grossAmount: number,
  gatewayFee: number | null,
  config: CommissionConfig
): EarningsBreakdown {
  // Si no tenemos la comisión real, estimarla
  const isEstimated = gatewayFee === null;
  const actualGatewayFee = gatewayFee ?? Math.round(
    grossAmount * config.payment_gateway_fee_percentage / 100
  );

  // Monto neto después de comisión de pasarela
  const netAmount = grossAmount - actualGatewayFee;

  // Calcular share del fotógrafo
  const photographerShare = Math.round(
    netAmount * config.photographer_percentage / 100
  );

  // Calcular share del director
  const directorShare = Math.round(
    netAmount * config.director_percentage / 100
  );

  return {
    gross_amount: grossAmount,
    gateway_fee: actualGatewayFee,
    gateway_fee_estimated: isEstimated,
    net_amount: netAmount,
    photographer_share: photographerShare,
    director_share: directorShare,
    photographer_percentage: config.photographer_percentage,
    director_percentage: config.director_percentage,
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Crea los detalles completos de la transacción
 *
 * @param photoCount - Número de fotos en la solicitud
 * @param pricePerPhoto - Precio por foto vigente
 * @param gatewayFee - Comisión real de Flow (opcional)
 * @param config - Configuración de comisiones
 * @param flowOrder - Número de orden de Flow
 * @returns Detalles completos de la transacción
 */
export function createTransactionDetails(
  photoCount: number,
  pricePerPhoto: number,
  gatewayFee: number | null,
  config: CommissionConfig,
  flowOrder?: number
): TransactionDetails {
  const grossAmount = photoCount * pricePerPhoto;
  const breakdown = calculateEarningsBreakdown(grossAmount, gatewayFee, config);

  return {
    ...breakdown,
    price_per_photo: pricePerPhoto,
    photo_count: photoCount,
    flow_order: flowOrder,
    commission_snapshot: config,
  };
}

/**
 * Valida que los porcentajes sumen 100
 */
export function validateCommissionConfig(config: CommissionConfig): {
  valid: boolean;
  error?: string;
} {
  const sum = config.photographer_percentage + config.director_percentage;

  if (sum !== 100) {
    return {
      valid: false,
      error: `Los porcentajes deben sumar 100. Actual: ${sum}%`,
    };
  }

  if (config.photographer_percentage < 0 || config.director_percentage < 0) {
    return {
      valid: false,
      error: 'Los porcentajes no pueden ser negativos',
    };
  }

  return { valid: true };
}

/**
 * Calcula el total pendiente de pago para un fotógrafo o director
 *
 * @param requests - Array de solicitudes con transaction_details
 * @param recipientType - 'photographer' o 'director'
 * @returns Total pendiente
 */
export function calculatePendingEarnings(
  requests: Array<{ transaction_details: TransactionDetails | null; settlement_status: string }>,
  recipientType: 'photographer' | 'director'
): number {
  return requests.reduce((total, request) => {
    if (!request.transaction_details || request.settlement_status === 'settled') {
      return total;
    }

    const share = recipientType === 'photographer'
      ? request.transaction_details.photographer_share
      : request.transaction_details.director_share;

    return total + share;
  }, 0);
}
