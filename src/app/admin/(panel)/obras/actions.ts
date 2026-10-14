"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_ARCHIVOS } from "@/lib/archivos/constants";
import { ULTIMO_PASO } from "@/lib/obras/asistente";
import {
  clienteSchema,
  equipoSchema,
  generalesSchema,
  serviciosSchema,
  superficiesSchema,
  ubicacionSchema,
} from "@/lib/obras/schemas";

export type GuardarResultado = { ok: true; obraId: string } | { ok: false; error: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

function primerError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos inválidos";
}

function revalidarObra(obraId: string) {
  revalidatePath("/admin/obras");
  revalidatePath(`/admin/obras/${obraId}`);
}

/** Avanza el punto de retome del asistente, sin retroceder si se edita un paso anterior. */
async function avanzarAsistente(supabase: Supabase, obraId: string, paso: number) {
  const { data } = await supabase
    .from("obras")
    .select("borrador, asistente_paso")
    .eq("id", obraId)
    .single();
  if (!data?.borrador) return;

  const siguiente = Math.min(paso + 1, ULTIMO_PASO);
  if (siguiente > data.asistente_paso) {
    await supabase.from("obras").update({ asistente_paso: siguiente }).eq("id", obraId);
  }
}

/**
 * Guarda un paso del asistente (también se usa para editar una obra ya cargada).
 * Paso 1 sin obraId crea la obra.
 */
export async function guardarPaso(
  obraId: string | null,
  paso: number,
  payload: unknown
): Promise<GuardarResultado> {
  const staff = await getStaff();
  if (!staff) return { ok: false, error: "Tu sesión venció. Volvé a ingresar." };

  const supabase = await createClient();

  if (!obraId && paso !== 1) return { ok: false, error: "Falta la obra." };

  try {
    let id = obraId;

    switch (paso) {
      case 1: {
        const parsed = generalesSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

        if (id) {
          const { error } = await supabase.from("obras").update(parsed.data).eq("id", id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("obras")
            .insert({ ...parsed.data, created_by: staff.id, asistente_paso: 2 })
            .select("id")
            .single();
          if (error) throw error;
          id = data.id;
        }
        break;
      }

      case 2: {
        const parsed = clienteSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };
        const { cliente_id, datos } = parsed.data;

        let clienteId = cliente_id;
        if (datos && clienteId) {
          const { error } = await supabase.from("clientes").update(datos).eq("id", clienteId);
          if (error) throw error;
        } else if (datos) {
          const { data, error } = await supabase.from("clientes").insert(datos).select("id").single();
          if (error) throw error;
          clienteId = data.id;
        }

        const { error } = await supabase.from("obras").update({ cliente_id: clienteId }).eq("id", id!);
        if (error) throw error;
        break;
      }

      case 3: {
        const parsed = ubicacionSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };
        const { error } = await supabase.from("obras").update(parsed.data).eq("id", id!);
        if (error) throw error;
        break;
      }

      case 4: {
        const parsed = superficiesSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };
        const { usa_sectores, sectores, ...superficies } = parsed.data;

        // Con sectores, el total sale de ellos: las superficies propias de la obra se vacían.
        const { error } = await supabase
          .from("obras")
          .update(
            usa_sectores
              ? { sup_cubierta: null, sup_semicubierta: null, sup_descubierta: null }
              : superficies
          )
          .eq("id", id!);
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc("reemplazar_listas_obra", {
          p_obra_id: id!,
          p_sectores: usa_sectores ? sectores : [],
        });
        if (rpcError) throw rpcError;
        break;
      }

      case 5: {
        const parsed = serviciosSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };
        const { error } = await supabase.from("obras").update(parsed.data).eq("id", id!);
        if (error) throw error;
        break;
      }

      case 6: {
        const parsed = equipoSchema.safeParse(payload);
        if (!parsed.success) return { ok: false, error: primerError(parsed.error) };
        const { error } = await supabase.rpc("reemplazar_listas_obra", {
          p_obra_id: id!,
          p_colaboradores: parsed.data.colaboradores,
          p_especialidades: parsed.data.especialidades,
        });
        if (error) throw error;
        break;
      }

      default:
        return { ok: false, error: "Paso inválido." };
    }

    await avanzarAsistente(supabase, id!, paso);
    revalidarObra(id!);
    return { ok: true, obraId: id! };
  } catch (e) {
    console.error(`Error guardando paso ${paso} de obra ${obraId}:`, e);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
  }
}

export async function finalizarCarga(obraId: string): Promise<GuardarResultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({ borrador: false, asistente_paso: ULTIMO_PASO })
    .eq("id", obraId);
  if (error) return { ok: false, error: "No se pudo finalizar la carga." };

  revalidarObra(obraId);
  return { ok: true, obraId };
}

export async function eliminarObra(obraId: string) {
  const supabase = await createClient();

  // Los registros de archivos se borran en cascada; los objetos de Storage hay que borrarlos aparte.
  const { data: archivos } = await supabase.from("archivos").select("storage_path").eq("obra_id", obraId);
  if (archivos && archivos.length > 0) {
    const { error } = await supabase.storage.from(BUCKET_ARCHIVOS).remove(archivos.map((a) => a.storage_path));
    if (error) return { ok: false as const, error: "No se pudieron borrar los archivos de la obra." };
  }

  const { error } = await supabase.from("obras").delete().eq("id", obraId);
  if (error) return { ok: false as const, error: "No se pudo eliminar la obra." };

  revalidatePath("/admin/obras");
  redirect("/admin/obras");
}
