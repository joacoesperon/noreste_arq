"use server";

import { revalidatePath } from "next/cache";
import { getStaff, type StaffUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checklistCompleto } from "@/lib/tareas/checklist";
import { estadoTareaLabel } from "@/lib/tareas/constants";
import { getTarea, type TareaDetalle } from "@/lib/tareas/queries";
import { envioRevisionSchema, tareaSchema } from "@/lib/tareas/schemas";

export type Resultado = { ok: true; id: string } | { ok: false; error: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Contexto = { supabase: Supabase; staff: StaffUser };

async function contexto(): Promise<Contexto | null> {
  const staff = await getStaff();
  if (!staff) return null;
  return { supabase: await createClient(), staff };
}

const SIN_SESION: Resultado = { ok: false, error: "Tu sesión venció. Volvé a ingresar." };
const ERROR: Resultado = { ok: false, error: "No se pudo guardar. Probá de nuevo." };

function revalidar() {
  // El tablero, las fichas de obra y el menú muestran tareas.
  revalidatePath("/admin", "layout");
}

async function registrar(ctx: Contexto, tareaId: string, tipo: string, detalle?: string | null) {
  await ctx.supabase
    .from("tarea_eventos")
    .insert({ tarea_id: tareaId, actor_id: ctx.staff.id, tipo, detalle: detalle ?? null });
}

export async function cargarTarea(id: string): Promise<TareaDetalle | null> {
  if (!(await getStaff())) return null;
  return getTarea(id).catch(() => null);
}

export async function crearTarea(payload: unknown): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const parsed = tareaSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { data, error } = await ctx.supabase
    .from("tareas")
    .insert({ ...parsed.data, created_by: ctx.staff.id })
    .select("id")
    .single();
  if (error) {
    console.error("crearTarea", error);
    return ERROR;
  }
  await registrar(ctx, data.id, "creada");
  revalidar();
  return { ok: true, id: data.id };
}

export async function actualizarTarea(id: string, payload: unknown): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const parsed = tareaSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { data: actual } = await ctx.supabase.from("tareas").select("tipo, estado").eq("id", id).single();
  if (!actual) return { ok: false, error: "La tarea no existe." };
  if (actual.estado === "en_revision" && actual.tipo !== parsed.data.tipo) {
    return { ok: false, error: "No se puede cambiar el tipo mientras está en revisión." };
  }
  // Una tarea completada como general no puede pasar a ser entrega sin aprobación.
  if (actual.estado === "completada" && parsed.data.tipo === "entrega" && actual.tipo !== "entrega") {
    return { ok: false, error: "Reabrí la tarea antes de convertirla en entrega." };
  }

  const { error } = await ctx.supabase.from("tareas").update(parsed.data).eq("id", id);
  if (error) {
    console.error("actualizarTarea", error);
    return ERROR;
  }
  revalidar();
  return { ok: true, id };
}

/**
 * Cambio de estado manual. Las entregas no se completan por acá: pasan por
 * «Enviar a revisión» y la aprobación de otra persona.
 */
export async function cambiarEstado(id: string, estado: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  if (!["pendiente", "en_curso", "completada"].includes(estado)) return { ok: false, error: "Estado inválido." };

  const { data: t } = await ctx.supabase.from("tareas").select("tipo, estado").eq("id", id).single();
  if (!t) return { ok: false, error: "La tarea no existe." };
  if (t.tipo === "entrega" && estado === "completada") {
    return { ok: false, error: "Las entregas se completan con la aprobación de otra persona." };
  }
  if (t.estado === estado) return { ok: true, id };

  const completada = estado === "completada";
  const { error } = await ctx.supabase
    .from("tareas")
    .update({
      estado,
      completada_at: completada ? new Date().toISOString() : null,
      completada_por: completada ? ctx.staff.id : null,
      // Reabrir una entrega aprobada o en revisión invalida la revisión anterior.
      ...(t.tipo === "entrega" ? { aprobada_por: null, aprobada_at: null } : {}),
    })
    .eq("id", id);
  if (error) {
    console.error("cambiarEstado", error);
    return ERROR;
  }
  await registrar(ctx, id, "estado", `${estadoTareaLabel(t.estado)} → ${estadoTareaLabel(estado)}`);
  revalidar();
  return { ok: true, id };
}

/** Guarda el avance del checklist sin enviar (se puede ir tildando de a poco). */
export async function guardarChecklist(id: string, checklist: Record<string, boolean>): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const { error } = await ctx.supabase.from("tareas").update({ checklist }).eq("id", id).neq("estado", "completada");
  if (error) return ERROR;
  revalidar();
  return { ok: true, id };
}

export async function enviarARevision(id: string, payload: unknown): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const parsed = envioRevisionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const datos = parsed.data;

  const { data: t } = await ctx.supabase.from("tareas").select("tipo, estado, responsable_id").eq("id", id).single();
  if (!t) return { ok: false, error: "La tarea no existe." };
  if (t.tipo !== "entrega") return { ok: false, error: "Solo las entregas pasan por revisión." };
  if (t.estado === "completada" || t.estado === "en_revision") {
    return { ok: false, error: "La tarea ya fue enviada a revisión." };
  }
  if (!checklistCompleto(datos.checklist)) {
    return { ok: false, error: "Completá todos los puntos del checklist antes de enviar." };
  }
  const responsable = t.responsable_id ?? ctx.staff.id;
  if (datos.revisor_id === responsable || datos.revisor_id === ctx.staff.id) {
    return { ok: false, error: "La revisión la tiene que hacer otra persona." };
  }

  const { error } = await ctx.supabase
    .from("tareas")
    .update({ ...datos, estado: "en_revision", responsable_id: responsable })
    .eq("id", id);
  if (error) {
    console.error("enviarARevision", error);
    return ERROR;
  }
  await registrar(ctx, id, "enviada_revision", datos.comentario_cierre);
  // TODO(etapa 3, correo): avisar al revisor por mail con el link a la tarea
  // cuando esté configurado el envío de correos (ver docs/pedidos-al-estudio.md).
  revalidar();
  return { ok: true, id };
}

async function tareaEnRevision(ctx: Contexto, id: string) {
  const { data: t } = await ctx.supabase
    .from("tareas")
    .select("tipo, estado, responsable_id, revisor_id")
    .eq("id", id)
    .single();
  if (!t || t.tipo !== "entrega" || t.estado !== "en_revision") {
    return { error: "La tarea no está en revisión." } as const;
  }
  if (t.responsable_id === ctx.staff.id) {
    return { error: "No podés aprobar tu propia entrega: la revisa otra persona." } as const;
  }
  return { tarea: t } as const;
}

export async function aprobarEntrega(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const r = await tareaEnRevision(ctx, id);
  if ("error" in r) return { ok: false, error: r.error! };

  const ahora = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("tareas")
    .update({
      estado: "completada",
      aprobada_por: ctx.staff.id,
      aprobada_at: ahora,
      completada_at: ahora,
      completada_por: ctx.staff.id,
    })
    .eq("id", id);
  if (error) {
    console.error("aprobarEntrega", error);
    return ERROR;
  }
  await registrar(ctx, id, "aprobada");
  revalidar();
  return { ok: true, id };
}

export async function devolverEntrega(id: string, comentario: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const motivo = comentario.trim();
  if (!motivo) return { ok: false, error: "Explicá qué hay que corregir." };
  const r = await tareaEnRevision(ctx, id);
  if ("error" in r) return { ok: false, error: r.error! };

  const { error } = await ctx.supabase.from("tareas").update({ estado: "en_curso" }).eq("id", id);
  if (error) return ERROR;
  await registrar(ctx, id, "devuelta", motivo);
  revalidar();
  return { ok: true, id };
}

export async function comentarTarea(id: string, texto: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const t = texto.trim();
  if (!t) return { ok: false, error: "Escribí un comentario." };
  await registrar(ctx, id, "comentario", t.slice(0, 5000));
  revalidar();
  return { ok: true, id };
}

export async function eliminarTarea(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return SIN_SESION;
  const { error } = await ctx.supabase.from("tareas").delete().eq("id", id);
  if (error) return ERROR;
  revalidar();
  return { ok: true, id };
}
