'use client';

import { useEffect, useState } from 'react';

interface PromotionInfo {
  id: string;
  name: string;
  type: string;
  discountAmount: number;
  promoCodeId?: string;
  promoCode?: string;
}

interface PricingData {
  photoCount: number;
  basePrice: number;
  effectivePrice: number;
  totalPrice: number;
  baseTotalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  tierName: string;
  promotion?: PromotionInfo | null;
  nextTier: {
    name: string;
    minPhotos: number;
    discountPercentage: number;
    photosToUnlock: number;
  } | null;
}

interface ValidatedPromo {
  promotion: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    discount_percentage: number | null;
    discount_amount: number | null;
    fixed_price_per_photo: number | null;
    min_photos: number;
    ends_at: string | null;
  };
  promo_code_id: string;
}

interface PricingDisplayProps {
  selectedPhotoCount: number;
  galleryId?: string;
  promoCode?: string;
  onPromoValidated?: (promo: ValidatedPromo | null) => void;
}

export default function PricingDisplay({
  selectedPhotoCount,
  galleryId,
  promoCode,
  onPromoValidated,
}: PricingDisplayProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<ValidatedPromo | null>(null);
  const [promoError, setPromoError] = useState('');

  // Validar código promo cuando cambia
  useEffect(() => {
    if (!promoCode || promoCode.trim().length === 0) {
      setValidatedPromo(null);
      setPromoError('');
      onPromoValidated?.(null);
      return;
    }

    const validateCode = async () => {
      try {
        const res = await fetch('/api/pricing/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: promoCode,
            gallery_id: galleryId,
            photo_count: selectedPhotoCount,
          }),
        });
        const data = await res.json();

        if (data.valid) {
          setValidatedPromo(data);
          setPromoError('');
          onPromoValidated?.(data);
        } else {
          setValidatedPromo(null);
          setPromoError(data.error || 'Código inválido');
          onPromoValidated?.(null);
        }
      } catch {
        setPromoError('Error validando código');
        setValidatedPromo(null);
        onPromoValidated?.(null);
      }
    };

    const timer = setTimeout(validateCode, 500); // Debounce
    return () => clearTimeout(timer);
  }, [promoCode, galleryId, selectedPhotoCount]);

  // Calcular precio
  useEffect(() => {
    if (selectedPhotoCount === 0) {
      setPricing(null);
      return;
    }

    const fetchPricing = async () => {
      setLoading(true);
      try {
        const body: Record<string, any> = {
          photo_count: selectedPhotoCount,
          gallery_id: galleryId,
        };

        if (validatedPromo) {
          body.promo_code = promoCode;
          body.promo_code_id = validatedPromo.promo_code_id;
          body.promo_promotion = validatedPromo.promotion;
        }

        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Error calculando precio');

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
  }, [selectedPhotoCount, galleryId, validatedPromo]);

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
  const hasPromotion = pricing.promotion && pricing.promotion.discountAmount > 0;

  return (
    <div className="space-y-4">
      {/* Banner de promoción activa */}
      {hasPromotion && (
        <div className="rounded-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <div>
              <div className="text-sm font-bold text-purple-800">
                {pricing.promotion!.name}
              </div>
              <div className="text-xs text-purple-600">
                Ahorro adicional: -${pricing.promotion!.discountAmount.toLocaleString('es-CL')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error de código promo */}
      {promoError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{promoError}</p>
        </div>
      )}

      {/* Información del tier actual */}
      <div
        className={`rounded-xl border-2 p-6 transition-all ${
          hasDiscount || hasPromotion
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
                {pricing.discountPercentage}% de descuento por volumen
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {pricing.photoCount} {pricing.photoCount === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
          </div>

          {(hasDiscount || hasPromotion) && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Precio normal:</span>
                <span className="line-through">
                  ${pricing.baseTotalPrice.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium text-green-600">
                <span>Descuento total:</span>
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
      {pricing.nextTier && !hasPromotion && (
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
      {selectedPhotoCount < 5 && !hasPromotion && (
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
