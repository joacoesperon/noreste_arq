import "server-only";
import type { ObraCompleta } from "@/lib/obras/queries";
import type { Cronograma } from "@/lib/cronogramas/queries";
import { estadoLabel } from "@/lib/obras/constants";
import { formatMeses } from "@/lib/obras/format";
import { formatM2, totalesSuperficie } from "@/lib/obras/superficies";
import { hoyAR } from "@/lib/tareas/semanas";
import type { ContextoDocumento } from "./datos";
import { ESTUDIO } from "./estudio";
import { formatFechaLarga } from "./formato";

/** "a, b y c" */
function enumerar(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** Datos de la obra listos para las plantillas. Lo que falta queda en "" y se marca en el documento. */
export function contextoObra(
  obra: ObraCompleta,
  cronogramas: Partial<Record<"proyecto" | "obra", Cronograma>>
): ContextoDocumento {
  const t = totalesSuperficie(obra, obra.sectores);
  const m2 = (v: number) => (t.total > 0 ? formatM2(v) : "");
  const fecha = (f: string | null) => (f ? formatFechaLarga(f) : "");
  const ubicacion = [obra.direccion, obra.localidad, obra.provincia].filter(Boolean).join(", ");
  const c = obra.cliente;
  const etapas = (tipo: "proyecto" | "obra") =>
    (cronogramas[tipo]?.etapas ?? []).map((e) => ({ nombre: e.nombre, inicio: e.inicio, fin: e.fin, clave: e.clave }));

  return {
    valores: {
      "obra.titulo": obra.titulo,
      "obra.tipologia": obra.tipologia ?? "",
      "obra.estado": estadoLabel(obra.estado),
      "obra.ubicacion": ubicacion,
      "obra.direccion": obra.direccion ?? "",
      "obra.localidad": obra.localidad ?? "",
      "obra.provincia": obra.provincia ?? "",
      "obra.superficie_total": m2(t.total),
      "obra.superficie_cubierta": m2(t.cubierta),
      "obra.superficie_semicubierta": m2(t.semicubierta),
      "obra.superficie_descubierta": m2(t.descubierta),
      "obra.servicios": enumerar(obra.servicios.map((s, i) => (i === 0 ? s : s.toLowerCase()))),
      "obra.proyecto_inicio": fecha(obra.proyecto_inicio),
      "obra.proyecto_duracion": formatMeses(obra.proyecto_duracion_meses) ?? "",
      "obra.obra_inicio": fecha(obra.obra_inicio),
      "obra.obra_duracion": formatMeses(obra.obra_duracion_meses) ?? "",
      "cliente.nombre": c?.nombre ?? "",
      "cliente.dni_cuit": c?.dni_cuit ?? "",
      "cliente.domicilio": c?.domicilio ?? "",
      "cliente.email": c?.email ?? "",
      "cliente.telefono": c?.telefono ?? "",
      "estudio.nombre": ESTUDIO.nombre,
      "estudio.profesionales": ESTUDIO.profesionales,
      "estudio.email": ESTUDIO.email,
      "estudio.telefono": ESTUDIO.telefono,
      "fecha.hoy": formatFechaLarga(hoyAR()),
    },
    servicios: obra.servicios,
    especialidades: obra.especialidades.map((e) => ({ especialidad: e.especialidad, responsable: e.responsable })),
    superficies: {
      cubierta: t.cubierta,
      semicubierta: t.semicubierta,
      descubierta: t.descubierta,
      total: t.total,
      sectores: obra.sectores.map((s) => ({ nombre: s.nombre, total: totalesSuperficie(s).total })),
    },
    cronogramas: { proyecto: etapas("proyecto"), obra: etapas("obra") },
  };
}
