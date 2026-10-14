// Listas acordadas con el estudio (Noreste_Modificaciones_Web_v1.pdf, preguntas 3, 4 y 10).
// Se guardan como texto en la base: agregar o renombrar acá no requiere migración.

export const TIPOLOGIAS = [
  "Vivienda unifamiliar",
  "Vivienda multifamiliar de baja densidad",
  "Vivienda multifamiliar de media densidad",
  "Local comercial",
  "Oficinas",
  "Reforma",
  "Instalación deportiva",
  "Instalación ecuestre",
  "Masterplan / desarrollo inmobiliario",
  "Memorial",
  "Interiorismo",
  "Paisajismo",
] as const;

export const SERVICIOS = [
  "Anteproyecto",
  "Proyecto ejecutivo",
  "Dirección de obra",
  "Administración de obra",
  "Interiorismo",
  "Paisajismo",
  "Asesoramiento",
  "Desarrollo comercial de proyecto",
] as const;

export const ESTADOS = [
  { value: "propuesta", label: "Propuesta" },
  { value: "en_proyecto", label: "En proyecto" },
  { value: "en_obra", label: "En obra" },
  { value: "terminada", label: "Terminada" },
] as const;

export type EstadoObra = (typeof ESTADOS)[number]["value"];

export function estadoLabel(estado: string) {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

// Sugerencias: el campo acepta también texto libre.
export const ESPECIALIDADES = [
  "Estructura",
  "Instalación sanitaria",
  "Instalación eléctrica",
  "Instalación termomecánica (HVAC)",
  "Instalación de gas",
  "Paisajismo",
  "Interiorismo",
  "Iluminación",
  "Estudio de suelos",
  "Agrimensura",
  "Seguridad e higiene",
] as const;

export const ROLES_COLABORADOR = [
  "Director de proyecto",
  "Jefe de proyecto",
  "Dibujante",
  "Director de obra",
  "Colaborador",
] as const;
