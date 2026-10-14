import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Archivo = Database["public"]["Tables"]["archivos"]["Row"];

export async function listArchivosObra(obraId: string): Promise<Archivo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("archivos")
    .select("*")
    .eq("obra_id", obraId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
