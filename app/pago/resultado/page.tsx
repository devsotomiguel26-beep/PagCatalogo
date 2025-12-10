'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando el estado de tu pago...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No se recibió información del pago');
      setTimeout(() => router.push('/galerias'), 3000);
      return;
    }

    // Verificar el estado del pago
    verifyPayment(token);
  }, [searchParams, router]);

  const verifyPayment = async (token: string) => {
    try {
      // El webhook ya procesó el pago, solo necesitamos verificar el estado
      // En Flow, el token nos permite consultar el estado
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'paid') {
        setStatus('success');
        setMessage('¡Pago exitoso! Redirigiendo...');
        setTimeout(() => router.push('/pago/exitoso'), 1500);
      } else {
        setStatus('error');
        setMessage('El pago no pudo ser procesado');
        setTimeout(() => router.push('/pago/fallido'), 1500);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setMessage('Error al verificar el pago');
      setTimeout(() => router.push('/pago/fallido'), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <LoadingSpinner size="large" />
        <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          {status === 'loading' && 'Procesando tu pago...'}
          {status === 'success' && '¡Pago exitoso!'}
          {status === 'error' && 'Error en el pago'}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <LoadingSpinner size="large" />
          <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
            Cargando...
          </h2>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
