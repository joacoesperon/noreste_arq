// Pasos del asistente de carga de obras. Compartido entre cliente y servidor.
export const PASOS = [
  { n: 1, key: "generales", titulo: "Datos generales" },
  { n: 2, key: "cliente", titulo: "Cliente" },
  { n: 3, key: "ubicacion", titulo: "Ubicación" },
  { n: 4, key: "superficies", titulo: "Superficies" },
  { n: 5, key: "servicios", titulo: "Servicios y plazos" },
  { n: 6, key: "equipo", titulo: "Equipo y especialidades" },
  { n: 7, key: "resumen", titulo: "Resumen" },
] as const;

export const ULTIMO_PASO = PASOS.length;

export function pasoValido(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= ULTIMO_PASO ? n : 1;
}
