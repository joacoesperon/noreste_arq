import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { TipoCronograma } from "./modelos";

export type EtapaCronograma = Database["public"]["Tables"]["cronograma_etapas"]["Row"];
export type Cronograma = Database["public"]["Tables"]["cronogramas"]["Row"] & { etapas: EtapaCronograma[] };

export async function getCronogramas(obraId: string): Promise<Partial<Record<TipoCronograma, Cronograma>>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cronogramas")
    .select("*, etapas:cronograma_etapas(*)")
    .eq("obra_id", obraId)
    .order("orden", { referencedTable: "cronograma_etapas" });
  if (error) throw error;
  return Object.fromEntries(data.map((c) => [c.tipo, c]));
}
