import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Tarea = Tables["tareas"]["Row"];
export type TareaEvento = Tables["tarea_eventos"]["Row"];

export type TareaResumen = Pick<
  Tarea,
  "id" | "titulo" | "tipo" | "estado" | "fecha" | "obra_id" | "responsable_id" | "revisor_id" | "checklist" | "completada_at"
> & {
  obra: { id: string; titulo: string } | null;
};

const RESUMEN =
  "id, titulo, tipo, estado, fecha, obra_id, responsable_id, revisor_id, checklist, completada_at, obra:obras(id, titulo)";

/** Tareas abiertas (no completadas) de todas las obras, para el tablero. */
export async function listTareasAbiertas(): Promise<TareaResumen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .select(RESUMEN)
    .neq("estado", "completada")
    .order("fecha", { ascending: true, nullsFirst: false })
    .order("created_at");
  if (error) throw error;
  return data;
}

/** Todas las tareas de una obra, abiertas primero. */
export async function listTareasObra(obraId: string): Promise<TareaResumen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .select(RESUMEN)
    .eq("obra_id", obraId)
    .order("completada_at", { ascending: false, nullsFirst: true })
    .order("fecha", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function contarCompletadasDesde(desde: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tareas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "completada")
    .gte("completada_at", `${desde}T00:00:00-03:00`);
  return count ?? 0;
}

export type TareaDetalle = Tarea & {
  obra: { id: string; titulo: string } | null;
  eventos: TareaEvento[];
};

export async function getTarea(id: string): Promise<TareaDetalle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .select("*, obra:obras(id, titulo), eventos:tarea_eventos(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "tarea_eventos", ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ObraOpcion = { id: string; titulo: string; estado: string };

/** Obras para asignar tareas: todas salvo las terminadas. */
export async function listObrasOpciones(): Promise<ObraOpcion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select("id, titulo, estado")
    .neq("estado", "terminada")
    .order("titulo");
  if (error) throw error;
  return data;
}

/** Entregas esperando la revisión de esta persona (aviso en el menú). */
export async function contarParaRevisar(staffId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tareas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "en_revision")
    .eq("revisor_id", staffId);
  return count ?? 0;
}
