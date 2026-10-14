import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Cliente de Supabase con la sesión del usuario (cookies).
 * Las consultas pasan por RLS como `authenticated`: usar en el panel y en las API.
 * El sitio público sigue usando el cliente anónimo de `@/lib/supabase`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: no puede escribir cookies.
            // El proxy se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
