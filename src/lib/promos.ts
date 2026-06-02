import { createPublicClient } from '@/lib/supabase/public';
import { isPromoLive } from '@/lib/promo-engine';
import type { Promotion } from '@/lib/types';

// Forma ligera que consume el landing.
export type PublicPromo = { id: string; name: string; description: string };

// Lee las promos públicas vigentes (active + show_on_landing + dentro de ventana
// temporal / con presupuesto) para anunciarlas en el landing. Sin credenciales o
// ante cualquier fallo devuelve [] → la sección simplemente no se renderiza.
export async function getPublicPromos(): Promise<PublicPromo[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  try {
    const supabase = createPublicClient();
    // La RLS ya limita a active + show_on_landing; aquí filtramos ventana/presupuesto.
    const { data, error } = await supabase
      .from('promotions')
      .select('id, name, description, active, starts_at, ends_at, days_mask, time_from, time_to, max_redemptions, redemptions')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const now = new Date();
    return data
      .filter((p) => isPromoLive(p as unknown as Promotion, now))
      .map((p) => ({ id: p.id as string, name: p.name as string, description: (p.description as string) || '' }));
  } catch {
    return [];
  }
}
