import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type ConsultaWeb = Tables<"consultas_web">;

export async function listConsultas(): Promise<ConsultaWeb[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("consultas_web").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return data;
}

export async function contarConsultasNuevas() {
  const supabase = await createClient();
  const { count } = await supabase.from("consultas_web").select("id", { count: "exact", head: true }).eq("atendida", false);
  return count ?? 0;
}
