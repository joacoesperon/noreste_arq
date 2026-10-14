export const ESTADOS_TAREA = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "en_revision", label: "En revisión" },
  { value: "completada", label: "Completada" },
] as const;

export type EstadoTarea = (typeof ESTADOS_TAREA)[number]["value"];

export function estadoTareaLabel(estado: string) {
  return ESTADOS_TAREA.find((e) => e.value === estado)?.label ?? estado;
}

export const TIPOS_TAREA = [
  { value: "general", label: "Tarea" },
  { value: "entrega", label: "Entrega de documentación" },
] as const;

export type TipoTarea = (typeof TIPOS_TAREA)[number]["value"];
