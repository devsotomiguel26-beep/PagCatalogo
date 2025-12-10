import { NextResponse } from 'next/server';

/**
 * Endpoint para diagnosticar configuración de Flow
 * NO expone las claves completas por seguridad
 */
export async function GET() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const sandbox = process.env.FLOW_SANDBOX;
  const pricePerPhoto = process.env.PRICE_PER_PHOTO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Función para mostrar solo primeros/últimos caracteres
  const maskKey = (key: string | undefined) => {
    if (!key) return 'NO CONFIGURADA';
    if (key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return NextResponse.json({
    environment: 'production',
    timestamp: new Date().toISOString(),
    config: {
      FLOW_API_KEY: {
        configured: !!apiKey,
        length: apiKey?.length || 0,
        preview: maskKey(apiKey),
      },
      FLOW_SECRET_KEY: {
        configured: !!secretKey,
        length: secretKey?.length || 0,
        preview: maskKey(secretKey),
      },
      FLOW_SANDBOX: {
        value: sandbox,
        isProduction: sandbox === 'false',
      },
      PRICE_PER_PHOTO: {
        value: pricePerPhoto || 'NOT SET (using default 2000)',
        parsed: parseInt(pricePerPhoto || '2000', 10),
      },
      NEXT_PUBLIC_APP_URL: {
        value: appUrl,
      },
    },
    flowApiUrl: sandbox === 'false'
      ? 'https://www.flow.cl/api'
      : 'https://sandbox.flow.cl/api',
    status: {
      ready: !!(apiKey && secretKey),
      warnings: [],
    },
  });
}
