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
  promotion?: PromotionApplied | null;
}

export interface PromotionApplied {
  id: string;
  name: string;
  type: string;
  discountAmount: number;
  promoCodeId?: string;
  promoCode?: string;
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

// --- Promociones ---

interface DbPromotion {
  id: string;
  name: string;
  type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  fixed_price_per_photo: number | null;
  scope: string;
  scope_gallery_id: string | null;
  scope_category_id: string | null;
  scope_event_type: string | null;
  min_photos: number;
  max_uses: number | null;
  current_uses: number;
  requires_code: boolean;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  stackable: boolean;
}

/**
 * Busca promociones activas que apliquen a una galería específica
 */
async function findActivePromotions(galleryId?: string): Promise<DbPromotion[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .eq('requires_code', false) // Solo las automáticas (sin código)
    .lte('starts_at', now)
    .order('priority', { ascending: false });

  const { data, error } = await query;

  if (error || !data) return [];

  // Filtrar por fecha de término y scope
  const filtered = data.filter((promo: DbPromotion) => {
    // Validar fecha de término
    if (promo.ends_at && new Date(promo.ends_at) < new Date()) return false;

    // Validar usos
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) return false;

    // Validar scope
    if (promo.scope === 'global') return true;

    // Si no hay galleryId, solo aplican las globales
    if (!galleryId) return promo.scope === 'global';

    return true; // Se validará en detalle después
  });

  // Si hay galleryId, verificar scopes específicos
  if (galleryId && filtered.some(p => p.scope !== 'global')) {
    const { data: gallery } = await supabase
      .from('galleries')
      .select('id, category_id, event_type')
      .eq('id', galleryId)
      .single();

    if (gallery) {
      return filtered.filter((promo: DbPromotion) => {
        if (promo.scope === 'global') return true;
        if (promo.scope === 'gallery') return promo.scope_gallery_id === galleryId;
        if (promo.scope === 'category') return promo.scope_category_id === gallery.category_id;
        if (promo.scope === 'event_type') return promo.scope_event_type === gallery.event_type;
        return false;
      });
    }
  }

  return filtered.filter((p: DbPromotion) => p.scope === 'global');
}

/**
 * Aplica una promoción sobre un cálculo de precio base
 */
function applyPromotion(
  basePricing: PricingCalculation,
  promo: DbPromotion,
  promoCodeId?: string,
  promoCode?: string,
): PricingCalculation {
  let promoDiscountAmount = 0;
  let finalTotal = basePricing.totalPrice;

  switch (promo.type) {
    case 'percentage_discount':
      promoDiscountAmount = Math.round(basePricing.totalPrice * (promo.discount_percentage || 0) / 100);
      finalTotal = basePricing.totalPrice - promoDiscountAmount;
      break;

    case 'fixed_discount':
      promoDiscountAmount = Math.min(promo.discount_amount || 0, basePricing.totalPrice);
      finalTotal = basePricing.totalPrice - promoDiscountAmount;
      break;

    case 'fixed_price_per_photo':
      if (promo.fixed_price_per_photo !== null) {
        finalTotal = promo.fixed_price_per_photo * basePricing.photoCount;
        promoDiscountAmount = basePricing.totalPrice - finalTotal;
      }
      break;

    case 'full_gallery':
      if (promo.fixed_price_per_photo !== null) {
        finalTotal = promo.fixed_price_per_photo * basePricing.photoCount;
        promoDiscountAmount = basePricing.totalPrice - finalTotal;
      }
      break;
  }

  // Nunca cobrar negativo
  if (finalTotal < 0) finalTotal = 0;
  if (promoDiscountAmount < 0) promoDiscountAmount = 0;

  return {
    ...basePricing,
    totalPrice: finalTotal,
    effectivePrice: Math.round(finalTotal / basePricing.photoCount),
    discountAmount: basePricing.discountAmount + promoDiscountAmount,
    promotion: {
      id: promo.id,
      name: promo.name,
      type: promo.type,
      discountAmount: promoDiscountAmount,
      promoCodeId,
      promoCode,
    },
  };
}

/**
 * Calcula precio con tiers + promociones activas
 * Extiende calculatePrice() con soporte de promociones automáticas y códigos promo
 */
export async function calculatePriceWithPromotions(
  photoCount: number,
  galleryId?: string,
  promoCode?: string,
  promoCodeId?: string,
  promoPromotion?: any, // Promoción ya validada desde validate-code
): Promise<PricingCalculation> {
  // Primero calcular precio base con tiers
  const basePricing = await calculatePrice(photoCount);

  // Si se proporcionó un código promo ya validado, aplicar su promoción
  if (promoPromotion && promoCodeId) {
    if (photoCount >= (promoPromotion.min_photos || 1)) {
      return applyPromotion(basePricing, promoPromotion, promoCodeId, promoCode);
    }
  }

  // Buscar promociones automáticas activas
  try {
    const activePromos = await findActivePromotions(galleryId);

    // Filtrar por min_photos
    const applicablePromos = activePromos.filter(p => photoCount >= (p.min_photos || 1));

    if (applicablePromos.length === 0) {
      return { ...basePricing, promotion: null };
    }

    // Aplicar la promoción de mayor prioridad (ya están ordenadas por priority DESC)
    const bestPromo = applicablePromos[0];
    return applyPromotion(basePricing, bestPromo);
  } catch {
    // Si falla la búsqueda de promos, retornar precio base sin promoción
    return { ...basePricing, promotion: null };
  }
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
