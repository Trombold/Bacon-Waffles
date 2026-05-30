import { createPublicClient } from '@/lib/supabase/public';
import { REVIEWS as STATIC_REVIEWS } from '@/lib/data';

// Forma que consume el landing: n = nombre, t = texto, s = estrellas.
export type PublicReview = { n: string; t: string; s: number };

// Lee las reseñas públicas (activas) desde Supabase. Si no hay credenciales
// (preview local) o falla la consulta, cae a las reseñas estáticas de data.ts.
export async function getPublicReviews(): Promise<PublicReview[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return STATIC_REVIEWS;
  }
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('name, text, stars')
      .eq('active', true)
      .order('sort')
      .order('created_at');

    if (error || !data || data.length === 0) return STATIC_REVIEWS;

    return data.map((r) => ({ n: r.name, t: r.text, s: Number(r.stars) }));
  } catch {
    return STATIC_REVIEWS;
  }
}
