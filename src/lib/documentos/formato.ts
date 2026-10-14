export type Moneda = "ARS" | "USD";

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "Pesos (ARS)" },
  { value: "USD", label: "Dólares (USD)" },
];

export function formatMonto(valor: number, moneda: Moneda = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

const fechaLarga = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** `YYYY-MM-DD` → «14 de octubre de 2026». */
export function formatFechaLarga(fecha: string) {
  return fechaLarga.format(new Date(`${fecha}T00:00:00Z`));
}

const fechaLargaEn = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** `YYYY-MM-DD` → «May 31, 2026» (contratos bilingües). */
export function formatFechaLargaEn(fecha: string) {
  return fechaLargaEn.format(new Date(`${fecha}T00:00:00Z`));
}

export function formatFechaCorta(fecha: string) {
  return fechaCorta.format(new Date(`${fecha}T00:00:00Z`));
}

/**
 * Número escrito a la argentina o a la inglesa: "1.250.000,50", "1.250.000", "4,072.20", "1250000.5", "30,5".
 */
export function parseNumero(valor: string): number | null {
  let v = valor.trim().replace(/[^\d.,-]/g, "");
  if (!v) return null;
  const coma = v.lastIndexOf(",");
  const punto = v.lastIndexOf(".");
  if (coma >= 0 && punto >= 0) {
    // Los dos separadores: el último es el decimal ("1.250,50" o "1,250.50").
    v = coma > punto ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  } else if (coma >= 0) {
    // Solo coma: decimal, salvo que sean grupos de miles ("1,250,000").
    v = /^-?\d{1,3}(,\d{3}){2,}$/.test(v) ? v.replace(/,/g, "") : v.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(v)) {
    v = v.replace(/\./g, "");
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const parseMonto = parseNumero;
