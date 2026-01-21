export interface PricingTier {
  name: string;
  minPhotos: number;
  maxPhotos: number | null; // null = infinito
  pricePerPhoto: number;
  discountPercentage: number;
}

export interface PricingCalculation {
  photoCount: number;
  basePrice: number;
  effectivePrice: number;
  totalPrice: number;
  baseTotalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  tierName: string;
  tier: PricingTier;
}

export interface NextTierInfo {
  name: string;
  minPhotos: number;
  discountPercentage: number;
  photosToUnlock: number;
}

/**
 * Verifica si el sistema de pricing tiers está habilitado
 */
export function isPricingTiersEnabled(): boolean {
  return process.env.PRICING_TIERS_ENABLED === 'true';
}

/**
 * Obtiene todos los tiers de pricing configurados
 */
export function getPricingTiers(): PricingTier[] {
  const enabled = isPricingTiersEnabled();
  const basePrice = parseInt(process.env.BASE_PRICE_PER_PHOTO || '2000');

  if (!enabled) {
    // Si está desactivado, retornar solo precio base
    return [
      {
        name: 'Precio Normal',
        minPhotos: 1,
        maxPhotos: null,
        pricePerPhoto: basePrice,
        discountPercentage: 0,
      },
    ];
  }

  // Parsear configuración de tiers
  const tier1Min = parseInt(process.env.TIER_1_MIN_PHOTOS || '5');
  const tier2Min = parseInt(process.env.TIER_2_MIN_PHOTOS || '10');
  const tier3Min = parseInt(process.env.TIER_3_MIN_PHOTOS || '15');

  const tier1Price = parseInt(process.env.TIER_1_PRICE_PER_PHOTO || '1800');
  const tier2Price = parseInt(process.env.TIER_2_PRICE_PER_PHOTO || '1600');
  const tier3Price = parseInt(process.env.TIER_3_PRICE_PER_PHOTO || '1400');

  const tier1Discount = parseInt(process.env.TIER_1_DISCOUNT_PERCENTAGE || '10');
  const tier2Discount = parseInt(process.env.TIER_2_DISCOUNT_PERCENTAGE || '20');
  const tier3Discount = parseInt(process.env.TIER_3_DISCOUNT_PERCENTAGE || '30');

  return [
    // Precio normal (antes del primer tier)
    {
      name: 'Precio Normal',
      minPhotos: 1,
      maxPhotos: tier1Min - 1,
      pricePerPhoto: basePrice,
      discountPercentage: 0,
    },
    // Tier 1: 5-9 fotos
    {
      name: `Pack ${tier1Min}-${tier2Min - 1} Fotos`,
      minPhotos: tier1Min,
      maxPhotos: tier2Min - 1,
      pricePerPhoto: tier1Price,
      discountPercentage: tier1Discount,
    },
    // Tier 2: 10-14 fotos
    {
      name: `Pack ${tier2Min}-${tier3Min - 1} Fotos`,
      minPhotos: tier2Min,
      maxPhotos: tier3Min - 1,
      pricePerPhoto: tier2Price,
      discountPercentage: tier2Discount,
    },
    // Tier 3: 15+ fotos
    {
      name: `Pack ${tier3Min}+ Fotos`,
      minPhotos: tier3Min,
      maxPhotos: null, // Sin límite superior
      pricePerPhoto: tier3Price,
      discountPercentage: tier3Discount,
    },
  ];
}

/**
 * Calcula el precio total y descuentos para una cantidad de fotos
 */
export function calculatePrice(photoCount: number): PricingCalculation {
  if (photoCount < 1) {
    throw new Error('La cantidad de fotos debe ser al menos 1');
  }

  const basePrice = parseInt(process.env.BASE_PRICE_PER_PHOTO || '2000');
  const tiers = getPricingTiers();

  // Encontrar tier aplicable
  const applicableTier = tiers.find((tier) => {
    const meetsMin = photoCount >= tier.minPhotos;
    const meetsMax = tier.maxPhotos === null || photoCount <= tier.maxPhotos;
    return meetsMin && meetsMax;
  });

  // Fallback al tier de precio normal si no encuentra
  const tier = applicableTier || tiers[0];

  const effectivePrice = tier.pricePerPhoto;
  const totalPrice = effectivePrice * photoCount;
  const baseTotalPrice = basePrice * photoCount;
  const discountAmount = baseTotalPrice - totalPrice;

  return {
    photoCount,
    basePrice,
    effectivePrice,
    totalPrice,
    baseTotalPrice,
    discountAmount,
    discountPercentage: tier.discountPercentage,
    tierName: tier.name,
    tier,
  };
}

/**
 * Obtiene información sobre el siguiente tier disponible
 */
export function getNextTier(currentPhotoCount: number): NextTierInfo | null {
  const tiers = getPricingTiers();

  const nextTier = tiers.find((tier) => tier.minPhotos > currentPhotoCount);

  if (!nextTier) {
    return null;
  }

  return {
    name: nextTier.name,
    minPhotos: nextTier.minPhotos,
    discountPercentage: nextTier.discountPercentage,
    photosToUnlock: nextTier.minPhotos - currentPhotoCount,
  };
}

/**
 * Obtiene todos los tiers con información completa para mostrar en UI
 */
export function getAllTiersForDisplay() {
  const tiers = getPricingTiers();
  const enabled = isPricingTiersEnabled();

  // Filtrar el tier de "Precio Normal" si hay descuentos habilitados
  const displayTiers = enabled
    ? tiers.filter(t => t.discountPercentage > 0)
    : tiers;

  return displayTiers.map((tier) => ({
    ...tier,
    exampleTotal: tier.pricePerPhoto * tier.minPhotos,
    exampleSavings:
      (parseInt(process.env.BASE_PRICE_PER_PHOTO || '2000') - tier.pricePerPhoto) *
      tier.minPhotos,
  }));
}
