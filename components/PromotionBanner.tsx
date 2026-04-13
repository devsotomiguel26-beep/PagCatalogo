'use client';

import { useEffect, useState } from 'react';

interface ActivePromotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  fixed_price_per_photo: number | null;
  ends_at: string | null;
  requires_code: boolean;
  promo_codes?: { code: string }[];
}

interface PromotionBannerProps {
  galleryId?: string;
}

export default function PromotionBanner({ galleryId }: PromotionBannerProps) {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchActivePromotions();
  }, [galleryId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, string> = {};
      promotions.forEach(p => {
        if (p.ends_at) {
          const diff = new Date(p.ends_at).getTime() - Date.now();
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
              newTimeLeft[p.id] = `${days}d ${hours}h`;
            } else if (hours > 0) {
              newTimeLeft[p.id] = `${hours}h ${minutes}m`;
            } else {
              newTimeLeft[p.id] = `${minutes}m`;
            }
          }
        }
      });
      setTimeLeft(newTimeLeft);
    }, 60000); // Actualizar cada minuto

    // Calcular inmediatamente
    const newTimeLeft: Record<string, string> = {};
    promotions.forEach(p => {
      if (p.ends_at) {
        const diff = new Date(p.ends_at).getTime() - Date.now();
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          if (days > 0) {
            newTimeLeft[p.id] = `${days}d ${hours}h`;
          } else if (hours > 0) {
            newTimeLeft[p.id] = `${hours}h ${minutes}m`;
          } else {
            newTimeLeft[p.id] = `${minutes}m`;
          }
        }
      }
    });
    setTimeLeft(newTimeLeft);

    return () => clearInterval(timer);
  }, [promotions]);

  async function fetchActivePromotions() {
    try {
      // Usar el endpoint público de pricing calculate para detectar promos activas
      // O consultar directamente las promos activas que no requieran código
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const now = new Date().toISOString();

      let query = supabase
        .from('promotions')
        .select('id, name, description, type, discount_percentage, discount_amount, fixed_price_per_photo, ends_at, requires_code, scope, scope_gallery_id, scope_category_id, starts_at')
        .eq('is_active', true)
        .lte('starts_at', now);

      const { data, error } = await query;

      if (error || !data) return;

      // Filtrar: vigentes y relevantes para esta galería
      const active = data.filter((p: any) => {
        // Verificar que no haya expirado
        if (p.ends_at && new Date(p.ends_at) < new Date()) return false;

        // Filtrar por scope
        if (p.scope === 'global') return true;
        if (p.scope === 'gallery' && galleryId) return p.scope_gallery_id === galleryId;

        // Para category y event_type, no tenemos esa info aquí
        // Se mostrarán globales y las de galería específica
        return false;
      });

      // No mostrar las que requieren código (el usuario no sabrá el código hasta que lo ingrese)
      const visible = active.filter((p: any) => !p.requires_code);

      setPromotions(visible);
    } catch {
      // Silenciar errores - el banner es opcional
    }
  }

  if (promotions.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {promotions.map(promo => (
        <div
          key={promo.id}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-red-600 p-4 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏷️</span>
              <div>
                <p className="font-bold text-lg">{promo.name}</p>
                {promo.description && (
                  <p className="text-sm text-white/80">{promo.description}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">
                {promo.type === 'percentage_discount' && `${promo.discount_percentage}% OFF`}
                {promo.type === 'fixed_discount' && `-$${(promo.discount_amount || 0).toLocaleString('es-CL')}`}
                {promo.type === 'fixed_price_per_photo' && `$${(promo.fixed_price_per_photo || 0).toLocaleString('es-CL')}/foto`}
                {promo.type === 'full_gallery' && 'Oferta Especial'}
              </div>
              {promo.ends_at && timeLeft[promo.id] && (
                <p className="text-xs text-white/70 mt-1">
                  Termina en {timeLeft[promo.id]}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
