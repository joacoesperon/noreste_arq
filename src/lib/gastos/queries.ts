import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Gasto = Tables["obra_gastos"]["Row"];
export type Gremio = Tables["obra_gremios"]["Row"];

export async function listGastosObra(obraId: string): Promise<{ gastos: Gasto[]; gremios: Gremio[] }> {
  const supabase = await createClient();
  const [gastos, gremios] = await Promise.all([
    supabase.from("obra_gastos").select("*").eq("obra_id", obraId).order("fecha").order("created_at"),
    supabase.from("obra_gremios").select("*").eq("obra_id", obraId).order("nombre"),
  ]);
  if (gastos.error) throw gastos.error;
  if (gremios.error) throw gremios.error;
  return { gastos: gastos.data, gremios: gremios.data };
}
