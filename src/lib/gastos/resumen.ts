import { lunesDe } from "@/lib/tareas/semanas";
import type { Moneda } from "@/lib/documentos/formato";

// Cálculos de la pestaña Gastos. Sirven en el servidor y en el navegador.

export type GastoBase = {
  id: string;
  fecha: string;
  monto: number;
  moneda: string;
  cotizacion: number | null;
  pagado: boolean;
  gremio_id: string | null;
};

/** Rubros sugeridos (los de la planilla de Casa Tots); el campo acepta texto libre. */
export const RUBROS_GASTO = [
  "Albañilería",
  "Corralón",
  "Trámite municipal",
  "Preliminares de obra",
  "Movimiento de suelos",
  "Cálculo estructural",
  "Electricidad",
  "Sanitaria",
  "Gas",
  "Herrería",
  "Carpintería",
  "Pintura",
  "Seguros",
  "Fletes",
  "Otros",
] as const;

/** Monto del gasto en la moneda pedida. null si hace falta la cotización y no está. */
export function montoEn(g: Pick<GastoBase, "monto" | "moneda" | "cotizacion">, moneda: Moneda): number | null {
  if (g.moneda === moneda) return g.monto;
  if (!g.cotizacion) return null;
  return moneda === "USD" ? g.monto / g.cotizacion : g.monto * g.cotizacion;
}

export type Totales = { ARS: number; USD: number; sinCotizacion: number };

/** Total en pesos y en dólares (cada gasto convertido con la cotización de su día). */
export function totales(gastos: GastoBase[]): Totales {
  const t: Totales = { ARS: 0, USD: 0, sinCotizacion: 0 };
  for (const g of gastos) {
    const ars = montoEn(g, "ARS");
    const usd = montoEn(g, "USD");
    if (ars === null || usd === null) t.sinCotizacion++;
    t.ARS += ars ?? (g.moneda === "ARS" ? g.monto : 0);
    t.USD += usd ?? (g.moneda === "USD" ? g.monto : 0);
  }
  return t;
}

/** Gastos agrupados por semana (lunes a domingo), de la más reciente a la más vieja. */
export function porSemana<T extends GastoBase>(gastos: T[]): { lunes: string; gastos: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const g of gastos) {
    const l = lunesDe(g.fecha);
    grupos.set(l, [...(grupos.get(l) ?? []), g]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([lunes, gs]) => ({ lunes, gastos: gs.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)) }));
}

/** Lo entregado a un gremio (solo pagos hechos), en la moneda del acuerdo. */
export function entregado(gastos: GastoBase[], gremioId: string, moneda: Moneda) {
  return gastos
    .filter((g) => g.gremio_id === gremioId && g.pagado)
    .reduce((acc, g) => acc + (montoEn(g, moneda) ?? 0), 0);
}
