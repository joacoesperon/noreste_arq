import "server-only";
import { BUCKET_ARCHIVOS } from "@/lib/archivos/constants";
import type { TipoCronograma } from "@/lib/cronogramas/modelos";
import { sumarDias } from "@/lib/cronogramas/fechas";
import { totalesSuperficie } from "@/lib/obras/superficies";
import { createAdminClient } from "@/lib/supabase/admin";
import { hoyAR, lunesDe } from "@/lib/tareas/semanas";

// Datos del portal del cliente (/cliente/[token]). Se leen con la service role porque el
// visitante no tiene sesión: acá se elige exactamente qué ve el cliente, y nada más.

/** Semanas de pagos previstos que ve el cliente, desde la semana actual. */
const SEMANAS_PAGOS = 8;
/** Vigencia de los links firmados de modelos y planos (se regeneran en cada visita). */
const VIGENCIA_ARCHIVOS = 60 * 60;

export type EtapaPortal = {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  clave: boolean;
  detalle: string | null;
  completados: string[];
};

export type PagoPortal = { id: string; fecha: string; rubro: string; detalle: string | null; monto: number; moneda: string };
export type ArchivoPortal = { id: string; nombre: string; url: string; tipo: "pdf" | "imagen" | "otro" };

export type Portal = {
  hoy: string;
  expiresAt: string | null;
  obra: {
    titulo: string;
    tipologia: string | null;
    localidad: string | null;
    estado: string;
    m2: number;
    cliente: string | null;
  };
  cronogramas: Partial<Record<TipoCronograma, EtapaPortal[]>>;
  pagos: PagoPortal[];
  modelos: ArchivoPortal[];
  planos: ArchivoPortal[];
};

function tipoArchivo(nombre: string, mime: string | null): ArchivoPortal["tipo"] {
  if (mime === "application/pdf" || /\.pdf$/i.test(nombre)) return "pdf";
  if (mime?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(nombre)) return "imagen";
  return "otro";
}

/** Datos del portal, o null si el link no existe, venció o fue revocado. */
export async function portalCompartido(token: string): Promise<Portal | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Portal del cliente: falta SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  const { data: link } = await supabase
    .from("obra_links")
    .select("obra_id, expires_at")
    .eq("token", token)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (!link) return null;

  const hoy = hoyAR();
  const desde = lunesDe(hoy);
  const hasta = sumarDias(desde, SEMANAS_PAGOS * 7 - 1);

  const [obraRes, cronoRes, pagosRes, archivosRes] = await Promise.all([
    supabase
      .from("obras")
      .select("titulo, tipologia, localidad, estado, sup_cubierta, sup_semicubierta, sup_descubierta, cliente:clientes(nombre), sectores:obra_sectores(sup_cubierta, sup_semicubierta, sup_descubierta)")
      .eq("id", link.obra_id)
      .single(),
    supabase
      .from("cronogramas")
      .select("tipo, etapas:cronograma_etapas(id, nombre, inicio, fin, clave, detalle, completados, orden)")
      .eq("obra_id", link.obra_id)
      .order("orden", { referencedTable: "cronograma_etapas" }),
    supabase
      .from("obra_gastos")
      .select("id, fecha, rubro, detalle, monto, moneda")
      .eq("obra_id", link.obra_id)
      .eq("pagado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha"),
    supabase
      .from("archivos")
      .select("id, nombre, mime, categoria, storage_path")
      .eq("obra_id", link.obra_id)
      .in("categoria", ["Planos", "Modelos 3D"])
      .order("nombre"),
  ]);
  const obra = obraRes.data;
  if (!obra) return null;

  const archivos = archivosRes.data ?? [];
  const elegidos = archivos.filter((a) => (a.categoria === "Modelos 3D" ? /\.ifc$/i.test(a.nombre) : tipoArchivo(a.nombre, a.mime) !== "otro"));
  const firmados = elegidos.length
    ? (await supabase.storage.from(BUCKET_ARCHIVOS).createSignedUrls(elegidos.map((a) => a.storage_path), VIGENCIA_ARCHIVOS)).data ?? []
    : [];
  const conUrl = elegidos.flatMap((a, i) => {
    const url = firmados[i]?.signedUrl;
    return url ? [{ ...a, url }] : [];
  });

  return {
    hoy,
    expiresAt: link.expires_at,
    obra: {
      titulo: obra.titulo,
      tipologia: obra.tipologia,
      localidad: obra.localidad,
      estado: obra.estado,
      m2: totalesSuperficie(obra, obra.sectores).total,
      cliente: obra.cliente?.nombre ?? null,
    },
    cronogramas: Object.fromEntries(
      (cronoRes.data ?? []).map((c) => [c.tipo, c.etapas.map(({ orden: _orden, ...e }) => e)])
    ),
    pagos: (pagosRes.data ?? []).map((g) => ({ ...g, monto: Number(g.monto) })),
    modelos: conUrl.filter((a) => a.categoria === "Modelos 3D").map((a) => ({ id: a.id, nombre: a.nombre, url: a.url, tipo: "otro" as const })),
    planos: conUrl
      .filter((a) => a.categoria === "Planos")
      .map((a) => ({ id: a.id, nombre: a.nombre, url: a.url, tipo: tipoArchivo(a.nombre, a.mime) })),
  };
}
