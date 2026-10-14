import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/** Cliente del navegador con la sesión del usuario (cookies). Usar solo en el panel. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
