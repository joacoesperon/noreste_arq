import { diasEntre } from "./fechas";

// Avance de las etapas: cada línea de «qué incluye» es un ítem; todos valen lo mismo.

/** Ítems de una etapa (una línea del detalle cada uno). */
export function itemsDe(detalle: string | null | undefined) {
  return (detalle ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** % de la etapa (0–100) o null si no tiene ítems. */
export function avanceEtapa(detalle: string | null | undefined, completados: readonly string[]) {
  const items = itemsDe(detalle);
  if (items.length === 0) return null;
  const hechos = items.filter((i) => completados.includes(i)).length;
  return Math.round((hechos / items.length) * 100);
}

type EtapaConAvance = { inicio: string; fin: string; detalle?: string | null; completados?: readonly string[] };

/** % del cronograma: promedio de las etapas con ítems, pesado por su duración. null si ninguna tiene ítems. */
export function avanceCronograma(etapas: readonly EtapaConAvance[]) {
  let peso = 0;
  let suma = 0;
  for (const e of etapas) {
    const a = avanceEtapa(e.detalle, e.completados ?? []);
    if (a === null) continue;
    const dias = diasEntre(e.inicio, e.fin) + 1;
    peso += dias;
    suma += a * dias;
  }
  return peso > 0 ? Math.round(suma / peso) : null;
}
