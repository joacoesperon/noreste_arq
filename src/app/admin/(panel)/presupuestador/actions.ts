"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { geocodificar } from "@/lib/presupuestador/geocodificar";
import { normalizar } from "@/lib/presupuestador/texto";
import { buscarVtex, dominioValido, precioVtex, type ProductoWeb } from "@/lib/presupuestador/vtex";
import { hoyAR } from "@/lib/tareas/semanas";

type Resultado = { ok: true; id?: string } | { ok: false; error: string };
const SIN_SESION = { ok: false, error: "Tu sesión venció." } as const;

const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

function revalidar() {
  revalidatePath("/admin/presupuestador", "layout");
}

// Materiales -------------------------------------------------------------------------

const materialSchema = z.object({
  codigo: texto(50),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(300),
  unidad: z.string().trim().min(1, "Indicá la unidad").max(30),
  rubro: z.string().trim().min(1, "Indicá el rubro").max(100),
  tipo: z.enum(["material", "mano_de_obra"]),
  notas: texto(2000),
  activo: z.boolean(),
});

export async function guardarMaterial(id: string | null, payload: unknown): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = materialSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("materiales").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("materiales").insert(parsed.data).select("id").single();
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Ya hay un material con ese código." : "No se pudo guardar." };
  }
  revalidar();
  return { ok: true, id: data.id };
}

export async function eliminarMaterial(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { error } = await supabase.from("materiales").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidar();
  return { ok: true };
}

// Proveedores ------------------------------------------------------------------------

const proveedorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  contacto: texto(200),
  telefono: texto(100),
  email: texto(200),
  web: texto(300),
  direccion: texto(300),
  localidad: texto(200),
  notas: texto(2000),
  activo: z.boolean(),
  recordatorio: z.boolean(),
  web_dominio: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .refine((v) => !v || dominioValido(v), "Dominio de tienda inválido (ej.: www.easy.com.ar)")
    .nullish()
    .transform((v) => (v ? v : null)),
});

export async function guardarProveedor(
  id: string | null,
  payload: unknown
): Promise<Resultado & { ubicado?: boolean }> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = proveedorSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();

  // Ubicar solo si cambió la dirección (o es nuevo).
  let ubicacion: { lat: number | null; lng: number | null } | undefined;
  const { data: actual } = id
    ? await supabase.from("proveedores").select("direccion, localidad, lat").eq("id", id).single()
    : { data: null };
  const cambioDireccion =
    !actual || actual.direccion !== parsed.data.direccion || actual.localidad !== parsed.data.localidad || actual.lat === null;
  if (cambioDireccion) {
    const g = await geocodificar([parsed.data.direccion, parsed.data.localidad]);
    ubicacion = { lat: g?.lat ?? null, lng: g?.lng ?? null };
  }

  // Tienda online: se prueba el catálogo antes de guardarla.
  if (parsed.data.web_dominio) {
    try {
      await buscarVtex(parsed.data.web_dominio, "cemento", 1);
    } catch {
      return { ok: false, error: "No se pudo leer el catálogo de esa tienda. Por ahora funcionan las tiendas VTEX (como Easy o Prestigio)." };
    }
  }
  const fila = { ...parsed.data, web_plataforma: parsed.data.web_dominio ? ("vtex" as const) : null, ...(ubicacion ?? {}) };
  const { data, error } = id
    ? await supabase.from("proveedores").update(fila).eq("id", id).select("id, lat").single()
    : await supabase.from("proveedores").insert(fila).select("id, lat").single();
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidar();
  return { ok: true, id: data.id, ubicado: data.lat !== null };
}

export async function eliminarProveedor(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidar();
  return { ok: true };
}

// Precios ----------------------------------------------------------------------------

const precioSchema = z.object({
  material_id: z.uuid(),
  proveedor_id: z.uuid({ error: "Elegí el proveedor" }),
  precio: z.number({ error: "Indicá el precio" }).nonnegative().max(1e12),
  moneda: z.enum(["ARS", "USD"]),
  fecha: z.iso.date(),
  referencia: texto(500),
});

export async function cargarPrecio(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = precioSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("precios").insert({ ...parsed.data, fuente: "manual", created_by: staff.id });
  if (error) return { ok: false, error: "No se pudo guardar el precio." };
  revalidar();
  revalidatePath("/admin/obras", "layout");
  return { ok: true };
}

const importacionSchema = z.object({
  proveedor_id: z.uuid({ error: "Elegí el proveedor" }),
  fecha: z.iso.date(),
  moneda: z.enum(["ARS", "USD"]),
  archivo: texto(300),
  filas: z
    .array(
      z.object({
        texto: z.string().trim().min(1).max(500),
        precio: z.number().nonnegative().max(1e12),
        material_id: z.uuid().nullable(),
        // Si no hay material asociado y se pide crearlo:
        nuevo: z
          .object({
            nombre: z.string().trim().min(1).max(300),
            unidad: z.string().trim().min(1).max(30),
            rubro: z.string().trim().min(1).max(100),
            codigo: texto(50),
          })
          .nullable(),
      })
    )
    .min(1, "No hay filas para importar")
    .max(5000),
});

/** Importa una lista de precios: precios con fuente y fecha + equivalencias para las próximas listas. */
export async function importarLista(payload: unknown): Promise<Resultado & { importados?: number }> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = importacionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { proveedor_id, fecha, moneda, archivo, filas } = parsed.data;
  const supabase = await createClient();

  // Crear los materiales nuevos pedidos
  const asociadas: { texto: string; precio: number; material_id: string }[] = [];
  for (const f of filas) {
    if (f.material_id) {
      asociadas.push({ texto: f.texto, precio: f.precio, material_id: f.material_id });
    } else if (f.nuevo) {
      const { data, error } = await supabase
        .from("materiales")
        .insert({ ...f.nuevo, tipo: "material", activo: true })
        .select("id")
        .single();
      if (error) {
        return {
          ok: false,
          error: error.code === "23505" ? `Ya existe un material con el código «${f.nuevo.codigo}».` : "No se pudo crear un material.",
        };
      }
      asociadas.push({ texto: f.texto, precio: f.precio, material_id: data.id });
    }
  }
  if (asociadas.length === 0) return { ok: false, error: "Asociá al menos una fila a un material." };

  const { data: lista, error: listaError } = await supabase
    .from("listas_precios")
    .insert({ proveedor_id, fecha, moneda, archivo, items: asociadas.length, created_by: staff.id })
    .select("id")
    .single();
  if (listaError) return { ok: false, error: "No se pudo registrar la lista." };

  const { error: preciosError } = await supabase.from("precios").insert(
    asociadas.map((a) => ({
      material_id: a.material_id,
      proveedor_id,
      lista_id: lista.id,
      precio: a.precio,
      moneda,
      fecha,
      fuente: "lista",
      referencia: archivo,
      descripcion_proveedor: a.texto,
      created_by: staff.id,
    }))
  );
  if (preciosError) {
    await supabase.from("listas_precios").delete().eq("id", lista.id);
    return { ok: false, error: "No se pudieron guardar los precios." };
  }

  // Equivalencias: la próxima lista de este proveedor se asocia sola.
  const equivalencias = new Map(asociadas.map((a) => [normalizar(a.texto), a.material_id]));
  await supabase.from("material_equivalencias").upsert(
    [...equivalencias].map(([t, material_id]) => ({ proveedor_id, texto: t, material_id })),
    { onConflict: "proveedor_id,texto" }
  );

  revalidar();
  revalidatePath("/admin/obras", "layout");
  return { ok: true, id: lista.id, importados: asociadas.length };
}

export async function eliminarLista(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { error } = await supabase.from("listas_precios").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la lista." };
  revalidar();
  return { ok: true };
}

/** Equivalencias del proveedor, para asociar sola una lista nueva. */
export async function equivalenciasProveedor(proveedorId: string) {
  if (!(await getStaff())) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("material_equivalencias").select("texto, material_id").eq("proveedor_id", proveedorId);
  return data ?? [];
}

// Presupuestos -----------------------------------------------------------------------

export async function crearPresupuesto(obraId: string) {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const supabase = await createClient();
  const { data: obra } = await supabase.from("obras").select("titulo").eq("id", obraId).single();
  if (!obra) return { ok: false as const, error: "La obra no existe." };
  const { data, error } = await supabase
    .from("presupuestos")
    .insert({ obra_id: obraId, titulo: `Presupuesto de materiales · ${obra.titulo}`, created_by: staff.id })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: "No se pudo crear el presupuesto." };
  revalidatePath(`/admin/obras/${obraId}`);
  redirect(`/admin/obras/${obraId}/presupuestos/${data.id}`);
}

const presupuestoSchema = z.object({
  titulo: z.string().trim().min(1, "El presupuesto necesita un título").max(300),
  moneda: z.enum(["ARS", "USD"]),
  cotizacion_usd: z.number().positive().max(1e7).nullable(),
  imprevistos_pct: z.number().min(0).max(100),
  radio_km: z.number().positive().max(1000),
  cac_base: z.iso.date().nullable(),
  notas: texto(5000),
  items: z
    .array(
      z.object({
        material_id: z.uuid().nullable(),
        descripcion: z.string().trim().min(1).max(500),
        unidad: texto(30),
        rubro: z.string().trim().min(1).max(100),
        cantidad: z.number().nonnegative().max(1e9),
        precio_id: z.uuid().nullable(),
        proveedor: texto(200),
        precio_unitario: z.number().nonnegative().max(1e12).nullable(),
        precio_fecha: z.iso.date().nullable(),
      })
    )
    .max(2000),
});

export async function guardarPresupuesto(id: string, payload: unknown): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = presupuestoSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { items, ...datos } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("presupuestos").update(datos).eq("id", id).select("obra_id").single();
  if (error || !data) return { ok: false, error: "No se pudo guardar." };
  const { error: itemsError } = await supabase.rpc("guardar_items_presupuesto", { p_presupuesto_id: id, p_items: items });
  if (itemsError) return { ok: false, error: "No se pudieron guardar los ítems." };
  revalidatePath(`/admin/obras/${data.obra_id}`);
  revalidar();
  return { ok: true };
}

export async function eliminarPresupuesto(id: string) {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { data, error } = await supabase.from("presupuestos").delete().eq("id", id).select("obra_id").single();
  if (error || !data) return { ok: false as const, error: "No se pudo eliminar." };
  revalidatePath(`/admin/obras/${data.obra_id}`);
  revalidar();
  redirect(`/admin/obras/${data.obra_id}?tab=presupuestos`);
}

/** Ubica la obra en el mapa a partir de su dirección (para el radio de proveedores). */
export async function ubicarObra(obraId: string): Promise<Resultado & { lat?: number; lng?: number; lugar?: string }> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { data: obra } = await supabase.from("obras").select("direccion, localidad, provincia").eq("id", obraId).single();
  if (!obra) return { ok: false, error: "La obra no existe." };
  const g = await geocodificar([obra.direccion, obra.localidad, obra.provincia]);
  if (!g) return { ok: false, error: "No se encontró la dirección de la obra. Revisá la ubicación en la ficha." };
  await supabase.from("obras").update({ lat: g.lat, lng: g.lng }).eq("id", obraId);
  revalidatePath(`/admin/obras/${obraId}`, "layout");
  return { ok: true, lat: g.lat, lng: g.lng, lugar: g.lugar };
}

// Precios de las webs de proveedores (tiendas VTEX) -----------------------------------

export type ResultadoWeb = { proveedor_id: string; proveedor: string; productos: ProductoWeb[]; error?: string };

/** Busca un texto en el catálogo de cada proveedor con tienda online. */
export async function buscarEnWeb(texto: string): Promise<ResultadoWeb[]> {
  if (!(await getStaff())) return [];
  const t = texto.trim().slice(0, 100);
  if (!t) return [];
  const supabase = await createClient();
  const { data: tiendas } = await supabase
    .from("proveedores")
    .select("id, nombre, web_dominio")
    .eq("activo", true)
    .eq("web_plataforma", "vtex");
  return Promise.all(
    (tiendas ?? [])
      .filter((p) => dominioValido(p.web_dominio))
      .map(async (p) => {
        try {
          return { proveedor_id: p.id, proveedor: p.nombre, productos: await buscarVtex(p.web_dominio!, t) };
        } catch (e) {
          return { proveedor_id: p.id, proveedor: p.nombre, productos: [], error: e instanceof Error ? e.message : "Error" };
        }
      })
  );
}

const vinculoSchema = z.object({
  material_id: z.uuid(),
  proveedor_id: z.uuid(),
  producto_id: z.string().regex(/^\w+$/).max(50),
});

/** Vincula un material con el producto de una tienda y guarda su precio de hoy (fuente «web»). */
export async function vincularProductoWeb(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = vinculoSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { material_id, proveedor_id, producto_id } = parsed.data;
  const supabase = await createClient();
  const { data: tienda } = await supabase.from("proveedores").select("web_dominio").eq("id", proveedor_id).single();
  if (!dominioValido(tienda?.web_dominio)) return { ok: false, error: "El proveedor no tiene tienda online configurada." };

  // El precio se vuelve a leer en el servidor: no se confía en el que muestra el navegador.
  const producto = await precioVtex(tienda.web_dominio, producto_id).catch(() => null);
  if (!producto) return { ok: false, error: "No se pudo leer el producto en la tienda." };

  const { error } = await supabase.from("material_productos_web").upsert(
    { material_id, proveedor_id, producto_id, nombre: producto.nombre, url: producto.url, ultima_lectura: new Date().toISOString(), ultimo_error: null },
    { onConflict: "material_id,proveedor_id" }
  );
  if (error) return { ok: false, error: "No se pudo guardar el vínculo." };
  await supabase.from("precios").insert({
    material_id,
    proveedor_id,
    precio: producto.precio,
    moneda: "ARS",
    fecha: hoyAR(),
    fuente: "web",
    referencia: producto.url,
    descripcion_proveedor: producto.nombre,
    created_by: staff.id,
  });
  revalidar();
  revalidatePath("/admin/obras", "layout");
  return { ok: true };
}

export async function desvincularProductoWeb(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { error } = await supabase.from("material_productos_web").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo quitar." };
  revalidar();
  return { ok: true };
}

// Índice CAC -------------------------------------------------------------------------

const indiceSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Elegí el mes"),
  valor: z.number({ error: "Indicá el valor del índice" }).positive("Indicá el valor del índice").max(1e9),
});

export async function guardarIndiceCac(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = indiceSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("indices_cac")
    .upsert({ mes: `${parsed.data.mes}-01`, valor: parsed.data.valor, created_by: staff.id, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "No se pudo guardar el índice." };
  revalidar();
  revalidatePath("/admin/obras", "layout");
  return { ok: true };
}

export async function eliminarIndiceCac(mes: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  if (!/^\d{4}-\d{2}-01$/.test(mes)) return { ok: false, error: "Mes inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("indices_cac").delete().eq("mes", mes);
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidar();
  return { ok: true };
}
