"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const DIAS_LINK = [0, 7, 30, 90, 365] as const;

/** Crea el link del portal del cliente para una obra (0 días = sin vencimiento). */
export async function crearLinkObra(obraId: string, dias: number): Promise<{ token: string } | { error: string }> {
  const staff = await getStaff();
  if (!staff) return { error: "Tu sesión venció." };
  if (!z.uuid().safeParse(obraId).success) return { error: "Obra inválida." };
  if (!(DIAS_LINK as readonly number[]).includes(dias)) return { error: "Duración inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obra_links")
    .insert({
      obra_id: obraId,
      expires_at: dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : null,
      created_by: staff.id,
    })
    .select("token")
    .single();
  if (error) return { error: "No se pudo crear el link." };

  revalidatePath(`/admin/obras/${obraId}`);
  return { token: data.token };
}

export async function revocarLinkObra(id: string): Promise<Resultado> {
  if (!(await getStaff())) return { ok: false, error: "Tu sesión venció." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Link inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("obra_links").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo revocar el link." };
  revalidatePath("/admin/obras", "layout");
  return { ok: true };
}
