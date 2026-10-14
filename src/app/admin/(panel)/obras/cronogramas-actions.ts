"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const etapasSchema = z
  .array(
    z
      .object({
        id: z.uuid().optional(),
        nombre: z.string().trim().min(1, "Cada etapa necesita un nombre").max(300),
        inicio: z.iso.date({ error: "Fecha de inicio inválida" }),
        fin: z.iso.date({ error: "Fecha de fin inválida" }),
        clave: z.boolean(),
      })
      .refine((e) => e.fin >= e.inicio, { message: "Hay una etapa que termina antes de empezar" })
  )
  .max(100);

const tipoSchema = z.enum(["proyecto", "obra"]);

export async function guardarCronograma(obraId: string, tipo: string, etapas: unknown): Promise<Resultado> {
  if (!(await getStaff())) return { ok: false, error: "Tu sesión venció." };
  const t = tipoSchema.safeParse(tipo);
  const e = etapasSchema.safeParse(etapas);
  if (!t.success) return { ok: false, error: "Tipo de cronograma inválido." };
  if (!e.success) return { ok: false, error: e.error.issues[0].message };
  if (e.data.length === 0) return { ok: false, error: "El cronograma necesita al menos una etapa." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("guardar_cronograma", {
    p_obra_id: obraId,
    p_tipo: t.data,
    p_etapas: e.data,
  });
  if (error) {
    console.error("guardarCronograma", error);
    return { ok: false, error: "No se pudo guardar el cronograma." };
  }
  // Las fechas clave crean o mueven tareas: refrescar todo el panel.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function eliminarCronograma(obraId: string, tipo: string): Promise<Resultado> {
  if (!(await getStaff())) return { ok: false, error: "Tu sesión venció." };
  const t = tipoSchema.safeParse(tipo);
  if (!t.success) return { ok: false, error: "Tipo de cronograma inválido." };

  const supabase = await createClient();
  // Vaciar primero: borra las tareas abiertas de sus fechas clave.
  const { error: vaciarError } = await supabase.rpc("guardar_cronograma", {
    p_obra_id: obraId,
    p_tipo: t.data,
    p_etapas: [],
  });
  const { error } = await supabase.from("cronogramas").delete().eq("obra_id", obraId).eq("tipo", t.data);
  if (vaciarError || error) return { ok: false, error: "No se pudo eliminar el cronograma." };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
