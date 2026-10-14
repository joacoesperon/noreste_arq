import { cache } from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type StaffUser = {
  id: string;
  usuario: string;
  nombre: string;
  /** Correo de contacto (notificaciones); puede faltar. */
  email: string | null;
  rol: "admin" | "miembro";
};

async function fetchStaff(supabase: ServerClient) {
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { hasSession: false, staff: null };

  const { data } = await supabase
    .from("staff")
    .select("id, usuario, nombre, email, rol")
    .eq("id", userId)
    .eq("activo", true)
    .maybeSingle();

  return { hasSession: true, staff: (data as StaffUser | null) ?? null };
}

/**
 * Usuario del estudio con sesión activa, o null si no hay sesión o el usuario
 * no figura (activo) en la tabla `staff`.
 */
export const getStaff = cache(async (): Promise<StaffUser | null> => {
  const { staff } = await fetchStaff(await createClient());
  return staff;
});

/**
 * Para route handlers: devuelve el cliente con la sesión del usuario si es del
 * estudio, o una respuesta 401/403 lista para retornar.
 */
export async function authorizeApi() {
  const supabase = await createClient();
  const { hasSession, staff } = await fetchStaff(supabase);

  if (!staff) {
    const error = hasSession
      ? NextResponse.json({ error: "Sin acceso al panel" }, { status: 403 })
      : NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return { supabase, staff: null, error } as const;
  }

  return { supabase, staff, error: null } as const;
}
