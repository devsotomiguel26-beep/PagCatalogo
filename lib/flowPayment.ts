import crypto from 'crypto';

const FLOW_API_URL = process.env.FLOW_SANDBOX === 'true'
  ? 'https://sandbox.flow.cl/api'
  : 'https://www.flow.cl/api';

interface FlowPaymentParams {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

interface FlowPaymentResponse {
  url: string;
  token: string;
  flowOrder: number;
}

/**
 * Genera firma HMAC SHA256 para Flow
 */
function generateSignature(params: Record<string, any>, secretKey: string): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map(key => `${key}=${params[key]}`).join('&');

  return crypto
    .createHmac('sha256', secretKey)
    .update(toSign)
    .digest('hex');
}

/**
 * Crea un pago en Flow y retorna la URL de pago
 */
export async function createFlowPayment(params: FlowPaymentParams): Promise<FlowPaymentResponse> {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Flow API credentials not configured');
  }

  // Preparar parámetros
  const paymentParams = {
    apiKey,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: 'CLP',
    amount: params.amount,
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  };

  // Generar firma
  const signature = generateSignature(paymentParams, secretKey);

  // Hacer request a Flow
  const response = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      ...paymentParams,
      s: signature,
    } as any),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Flow API error:', error);
    throw new Error(`Flow API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    url: data.url,
    token: data.token,
    flowOrder: data.flowOrder,
  };
}

/**
 * Verifica la firma de un webhook de Flow
 */
export function verifyFlowSignature(params: Record<string, any>, signature: string): boolean {
  const secretKey = process.env.FLOW_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Flow secret key not configured');
  }

  const calculatedSignature = generateSignature(params, secretKey);
  return calculatedSignature === signature;
}

/**
 * Obtiene el status de un pago desde Flow
 */
export async function getFlowPaymentStatus(token: string): Promise<any> {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Flow API credentials not configured');
  }

  const params = { apiKey, token };
  const signature = generateSignature(params, secretKey);

  const response = await fetch(
    `${FLOW_API_URL}/payment/getStatus?${new URLSearchParams({
      ...params,
      s: signature,
    } as any)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Flow API error:', error);
    throw new Error(`Flow API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Constantes de estados de Flow
 */
export const FLOW_STATUS = {
  PENDING: 1,    // Pendiente de pago
  PAID: 2,       // Pagado
  REJECTED: 3,   // Rechazado
  CANCELLED: 4,  // Anulado
};
