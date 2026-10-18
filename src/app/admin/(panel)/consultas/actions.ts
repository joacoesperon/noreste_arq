"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };
const SIN_SESION = { ok: false, error: "Tu sesión venció." } as const;

export async function marcarConsulta(id: string, atendida: boolean): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("consultas_web").update({ atendida }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function eliminarConsulta(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("consultas_web").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
