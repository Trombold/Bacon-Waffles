import { createClient } from '@supabase/supabase-js';

// Cliente sin sesión para lecturas públicas (menú del landing).
// No usa cookies → la página puede cachearse / ISR. Solo lee datos
// expuestos por RLS al rol anon (productos activos).
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
