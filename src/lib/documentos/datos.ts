import type { EtapaBloque } from "./bloques";
import type { FirmanteEstudio, Membrete } from "./estudio";
import type { ClaveCategoria, ConfigHonorarios } from "@/lib/honorarios/calculo";

// Datos que se pueden usar en las plantillas como {{clave}}.
// `bloque.*` va solo en un párrafo y se reemplaza por una tabla, lista o diagrama.

export type Dato = { key: string; label: string };
export type GrupoDatos = { grupo: string; datos: Dato[] };

export const DATOS_FIJOS: GrupoDatos[] = [
  {
    grupo: "Obra",
    datos: [
      { key: "obra.titulo", label: "Título" },
      { key: "obra.tipologia", label: "Tipología" },
      { key: "obra.ubicacion", label: "Ubicación completa" },
      { key: "obra.direccion", label: "Dirección" },
      { key: "obra.localidad", label: "Localidad" },
      { key: "obra.provincia", label: "Provincia" },
      { key: "obra.superficie_total", label: "Superficie total" },
      { key: "obra.superficie_cubierta", label: "Superficie cubierta" },
      { key: "obra.superficie_semicubierta", label: "Superficie semicubierta" },
      { key: "obra.superficie_descubierta", label: "Superficie descubierta" },
      { key: "obra.servicios", label: "Servicios (en una frase)" },
      { key: "obra.proyecto_inicio", label: "Inicio del proyecto" },
      { key: "obra.proyecto_duracion", label: "Duración del proyecto" },
      { key: "obra.obra_inicio", label: "Inicio de obra" },
      { key: "obra.obra_duracion", label: "Duración de obra" },
      { key: "obra.inicio", label: "Inicio estimado (todo el trabajo)" },
      { key: "obra.fin", label: "Fin estimado (todo el trabajo)" },
      { key: "obra.inicio_en", label: "Inicio estimado, en inglés" },
      { key: "obra.fin_en", label: "Fin estimado, en inglés" },
    ],
  },
  {
    grupo: "Cliente",
    datos: [
      { key: "cliente.nombre", label: "Nombre" },
      { key: "cliente.dni_cuit", label: "DNI / CUIT" },
      { key: "cliente.domicilio", label: "Domicilio" },
      { key: "cliente.email", label: "Correo" },
      { key: "cliente.telefono", label: "Teléfono" },
    ],
  },
  {
    grupo: "Estudio",
    datos: [
      { key: "estudio.nombre", label: "Nombre" },
      { key: "estudio.profesionales", label: "Profesionales" },
      { key: "estudio.firmantes", label: "Firmantes con DNI" },
      { key: "estudio.firmantes_matricula", label: "Firmantes con DNI y matrícula" },
      { key: "estudio.domicilio", label: "Domicilio" },
      { key: "estudio.email", label: "Correo" },
      { key: "estudio.instagram", label: "Instagram" },
      { key: "estudio.telefonos", label: "Teléfonos" },
    ],
  },
  {
    grupo: "General",
    datos: [
      { key: "fecha.hoy", label: "Fecha de hoy" },
      { key: "documento.tipo", label: "Tipo de documento" },
      { key: "documento.titulo", label: "Título del documento" },
    ],
  },
];

export const BLOQUES: Dato[] = [
  { key: "bloque.servicios", label: "Lista de servicios contratados" },
  { key: "bloque.superficies", label: "Tabla de superficies" },
  { key: "bloque.especialidades", label: "Tabla de especialidades" },
  { key: "bloque.presupuesto", label: "Tabla del presupuesto" },
  { key: "bloque.cronograma_proyecto", label: "Cronograma de proyecto" },
  { key: "bloque.cronograma_obra", label: "Cronograma de obra" },
  { key: "bloque.etapas", label: "Etapas con lo que incluye (del cronograma)" },
  { key: "bloque.forma_pago", label: "Forma de pago por hitos" },
  { key: "bloque.forma_pago_en", label: "Forma de pago por hitos (inglés)" },
  { key: "bloque.firmas", label: "Firmas" },
];

const LABELS = new Map<string, string>(
  [...DATOS_FIJOS.flatMap((g) => g.datos.map((d) => [d.key, `${g.grupo} · ${d.label}`] as const)), ...BLOQUES.map((b) => [b.key, b.label] as const)]
);

export function labelDato(key: string) {
  return LABELS.get(key) ?? key;
}

/** Contexto ya calculado de una obra, serializable para pasarlo al navegador. */
export type ContextoDocumento = {
  /** Valores de los datos fijos ("" si falta). */
  valores: Record<string, string>;
  servicios: string[];
  especialidades: { especialidad: string; responsable: string | null }[];
  superficies: {
    cubierta: number;
    semicubierta: number;
    descubierta: number;
    total: number;
    sectores: { nombre: string; total: number }[];
  };
  cronogramas: { proyecto: EtapaBloque[]; obra: EtapaBloque[] };
  firmantesEstudio: FirmanteEstudio[];
  membrete: Membrete;
  /** Para el botón «Calcular» de los honorarios. */
  honorarios: { config: ConfigHonorarios; categoria: ClaveCategoria; m2: number };
};
