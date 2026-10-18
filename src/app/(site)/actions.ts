"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const campo = z.string().trim().max(200).transform((v) => v || null);

const consultaSchema = z.object({
  tipo: z.string().trim().min(1).max(200),
  ubicacion: campo,
  servicio: campo,
  presupuesto: campo,
  etapa: campo,
  plazo: campo,
  nombre: z.string().trim().max(120).transform((v) => v || null),
  /** Campo trampa: invisible para las personas, los bots lo completan. */
  web: z.string().max(0),
});

/** Guarda la consulta del formulario «Cotizá tu proyecto» para verla en el panel. */
export async function guardarConsulta(payload: unknown): Promise<void> {
  const parsed = consultaSchema.safeParse(payload);
  if (!parsed.success) return;
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Consultas web: falta SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  const { web: _web, ...fila } = parsed.data;
  const { error } = await supabase.from("consultas_web").insert(fila);
  if (error) console.error("Consultas web:", error.message);
}
