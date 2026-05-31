import { createPublicClient } from '@/lib/supabase/public';
import { MENU as STATIC_MENU, type MenuItem } from '@/lib/data';

export type MenuGroups = { dulces: MenuItem[]; salados: MenuItem[]; combos: MenuItem[]; bebidas: MenuItem[] };

// Lee el menú público desde Supabase (productos activos). Si no hay credenciales
// (preview local) o falla la consulta, cae al menú estático de data.ts.
export async function getMenu(): Promise<MenuGroups> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return STATIC_MENU;
  }
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select('name, price, description, sweet, tag, cat')
      .eq('active', true)
      .order('sku');

    if (error || !data || data.length === 0) return STATIC_MENU;

    const byCat = (cat: string): MenuItem[] =>
      data
        .filter((p) => p.cat === cat)
        .map((p) => ({
          name: p.name,
          price: Number(p.price),
          desc: p.description || '',
          sweet: p.sweet ?? undefined,
          tag: p.tag ?? undefined,
        }));

    return { dulces: byCat('Dulces'), salados: byCat('Salados'), combos: byCat('Combos'), bebidas: byCat('Bebidas') };
  } catch {
    return STATIC_MENU;
  }
}
