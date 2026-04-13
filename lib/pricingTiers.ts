import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// --- Cache en memoria con TTL de 60 segundos ---
interface CachedData {
  config: { base_price_per_photo: number; pricing_tiers_enabled: boolean } | null;
  tiers: PricingTier[];
  timestamp: number;
}

let cache: CachedData | null = null;
const CACHE_TTL_MS = 60_000;

function isCacheValid(): boolean {
  return cache !== null && (Date.now() - cache.timestamp) < CACHE_TTL_MS;
}

// --- Lectura desde base de datos ---

interface DbPricingTier {
  name: string;
  min_photos: number;
  max_photos: number | null;
  price_per_photo: number;
  discount_percentage: number;
  is_active: boolean;
}

async function fetchFromDb(): Promise<CachedData | null> {
  try {
    const [configResult, tiersResult] = await Promise.all([
      supabase.from('pricing_config').select('base_price_per_photo, pricing_tiers_enabled').single(),
      supabase.from('pricing_tiers').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);

    if (configResult.error || tiersResult.error) {
      return null;
    }

    const tiers: PricingTier[] = (tiersResult.data as DbPricingTier[]).map((t) => ({
      name: t.name,
      minPhotos: t.min_photos,
      maxPhotos: t.max_photos,
      pricePerPhoto: t.price_per_photo,
      discountPercentage: t.discount_percentage,
    }));

    const result: CachedData = {
      config: configResult.data,
      tiers,
      timestamp: Date.now(),
    };

    cache = result;
    return result;
  } catch {
    return null;
  }
}

// --- Fallback a variables de entorno (compatibilidad) ---

function getConfigFromEnv(): CachedData {
  const enabled = process.env.PRICING_TIERS_ENABLED === 'true';
  const basePrice = parseInt(process.env.BASE_PRICE_PER_PHOTO || '2000');

  if (!enabled) {
    return {
      config: { base_price_per_photo: basePrice, pricing_tiers_enabled: false },
      tiers: [{
        name: 'Precio Normal',
        minPhotos: 1,
        maxPhotos: null,
        pricePerPhoto: basePrice,
        discountPercentage: 0,
      }],
      timestamp: Date.now(),
    };
  }

  const tier1Min = parseInt(process.env.TIER_1_MIN_PHOTOS || '5');
  const tier2Min = parseInt(process.env.TIER_2_MIN_PHOTOS || '10');
  const tier3Min = parseInt(process.env.TIER_3_MIN_PHOTOS || '15');
  const tier1Price = parseInt(process.env.TIER_1_PRICE_PER_PHOTO || '1800');
  const tier2Price = parseInt(process.env.TIER_2_PRICE_PER_PHOTO || '1600');
  const tier3Price = parseInt(process.env.TIER_3_PRICE_PER_PHOTO || '1400');
  const tier1Discount = parseInt(process.env.TIER_1_DISCOUNT_PERCENTAGE || '10');
  const tier2Discount = parseInt(process.env.TIER_2_DISCOUNT_PERCENTAGE || '20');
  const tier3Discount = parseInt(process.env.TIER_3_DISCOUNT_PERCENTAGE || '30');

  return {
    config: { base_price_per_photo: basePrice, pricing_tiers_enabled: true },
    tiers: [
      { name: 'Precio Normal', minPhotos: 1, maxPhotos: tier1Min - 1, pricePerPhoto: basePrice, discountPercentage: 0 },
      { name: `Pack ${tier1Min}-${tier2Min - 1} Fotos`, minPhotos: tier1Min, maxPhotos: tier2Min - 1, pricePerPhoto: tier1Price, discountPercentage: tier1Discount },
      { name: `Pack ${tier2Min}-${tier3Min - 1} Fotos`, minPhotos: tier2Min, maxPhotos: tier3Min - 1, pricePerPhoto: tier2Price, discountPercentage: tier2Discount },
      { name: `Pack ${tier3Min}+ Fotos`, minPhotos: tier3Min, maxPhotos: null, pricePerPhoto: tier3Price, discountPercentage: tier3Discount },
    ],
    timestamp: Date.now(),
  };
}

// --- Función central: obtener datos (DB → cache → env fallback) ---

async function getPricingData(): Promise<CachedData> {
  if (isCacheValid()) {
    return cache!;
  }

  const dbData = await fetchFromDb();
  if (dbData) {
    return dbData;
  }

  // Fallback a env vars si la DB no está disponible
  const envData = getConfigFromEnv();
  cache = envData;
  return envData;
}

// --- API pública ---

/**
 * Verifica si el sistema de pricing tiers está habilitado
 */
export async function isPricingTiersEnabled(): Promise<boolean> {
  const data = await getPricingData();
  return data.config?.pricing_tiers_enabled ?? false;
}

/**
 * Obtiene todos los tiers de pricing configurados
 */
export async function getPricingTiers(): Promise<PricingTier[]> {
  const data = await getPricingData();
  return data.tiers;
}

/**
 * Calcula el precio total y descuentos para una cantidad de fotos
 */
export async function calculatePrice(photoCount: number): Promise<PricingCalculation> {
  if (photoCount < 1) {
    throw new Error('La cantidad de fotos debe ser al menos 1');
  }

  const data = await getPricingData();
  const basePrice = data.config?.base_price_per_photo ?? 2000;
  const tiers = data.tiers;

  // Encontrar tier aplicable
  const applicableTier = tiers.find((tier) => {
    const meetsMin = photoCount >= tier.minPhotos;
    const meetsMax = tier.maxPhotos === null || photoCount <= tier.maxPhotos;
    return meetsMin && meetsMax;
  });

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
export async function getNextTier(currentPhotoCount: number): Promise<NextTierInfo | null> {
  const tiers = await getPricingTiers();

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
export async function getAllTiersForDisplay() {
  const data = await getPricingData();
  const tiers = data.tiers;
  const basePrice = data.config?.base_price_per_photo ?? 2000;
  const enabled = data.config?.pricing_tiers_enabled ?? false;

  const displayTiers = enabled
    ? tiers.filter(t => t.discountPercentage > 0)
    : tiers;

  return displayTiers.map((tier) => ({
    ...tier,
    exampleTotal: tier.pricePerPhoto * tier.minPhotos,
    exampleSavings: (basePrice - tier.pricePerPhoto) * tier.minPhotos,
  }));
}
