'use client';

import { useEffect, useState } from 'react';

interface PricingData {
  photoCount: number;
  basePrice: number;
  effectivePrice: number;
  totalPrice: number;
  baseTotalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  tierName: string;
  nextTier: {
    name: string;
    minPhotos: number;
    discountPercentage: number;
    photosToUnlock: number;
  } | null;
}

interface PricingDisplayProps {
  selectedPhotoCount: number;
}

export default function PricingDisplay({ selectedPhotoCount }: PricingDisplayProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPhotoCount === 0) {
      setPricing(null);
      return;
    }

    const fetchPricing = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_count: selectedPhotoCount }),
        });

        if (!res.ok) {
          throw new Error('Error calculando precio');
        }

        const data = await res.json();
        setPricing(data);
      } catch (error) {
        console.error('Error calculating pricing:', error);
        setPricing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [selectedPhotoCount]);

  if (selectedPhotoCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Selecciona las fotos que desees comprar</p>
      </div>
    );
  }

  if (loading || !pricing) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-sm text-gray-600">Calculando precio...</p>
      </div>
    );
  }

  const hasDiscount = pricing.discountPercentage > 0;

  return (
    <div className="space-y-4">
      {/* Información del tier actual */}
      <div
        className={`rounded-xl border-2 p-6 transition-all ${
          hasDiscount
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
            : 'border-gray-300 bg-white'
        }`}
      >
        {hasDiscount && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-lg font-bold text-green-700">
                {pricing.tierName}
              </div>
              <div className="text-sm font-semibold text-green-600">
                {pricing.discountPercentage}% de descuento
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {pricing.photoCount} {pricing.photoCount === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
          </div>

          {hasDiscount && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Precio normal:</span>
                <span className="line-through">
                  ${pricing.baseTotalPrice.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium text-green-600">
                <span>Descuento:</span>
                <span>-${pricing.discountAmount.toLocaleString('es-CL')}</span>
              </div>
              <div className="my-2 border-t border-gray-300"></div>
            </>
          )}

          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${pricing.totalPrice.toLocaleString('es-CL')}
              </div>
              <div className="text-xs text-gray-500">
                ${pricing.effectivePrice.toLocaleString('es-CL')} por foto
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incentivo para siguiente tier */}
      {pricing.nextTier && (
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                ¡Agrega {pricing.nextTier.photosToUnlock}{' '}
                {pricing.nextTier.photosToUnlock === 1 ? 'foto' : 'fotos'} más y obtén{' '}
                {pricing.nextTier.discountPercentage}% de descuento!
              </p>
              <p className="mt-1 text-sm text-blue-700">
                {pricing.nextTier.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información sobre los packs disponibles */}
      {selectedPhotoCount < 5 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Packs disponibles:
          </p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• 5-9 fotos: 10% descuento</li>
            <li>• 10-14 fotos: 20% descuento</li>
            <li>• 15+ fotos: 30% descuento</li>
          </ul>
        </div>
      )}
    </div>
  );
}
