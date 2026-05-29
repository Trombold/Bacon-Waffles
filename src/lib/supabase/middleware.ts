import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Modo mantenimiento: redirige el sitio público a /mantenimiento.
  // El CRM (/crm, /login) sigue accesible para el staff durante el mantenimiento.
  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    !path.startsWith('/mantenimiento') &&
    !path.startsWith('/crm') &&
    !path.startsWith('/login') &&
    !path.startsWith('/api')
  ) {
    return NextResponse.redirect(new URL('/mantenimiento', request.url));
  }

  // Solo en desarrollo: sin credenciales Supabase (preview local del landing),
  // no gestionamos sesión. En producción NUNCA se omite el guard — si faltan
  // las env vars, dejamos que el cliente Supabase falle de forma visible en vez
  // de exponer /crm sin protección.
  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasEnv && process.env.NODE_ENV !== 'production') {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No ejecutar código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Solo /crm está protegido. El landing (/) es público.
  if (!user && path.startsWith('/crm')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Usuario logueado entrando a /login → mandar al CRM.
  if (user && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/crm';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
