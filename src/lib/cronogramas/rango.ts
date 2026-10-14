import { diasEntre, sumarDias } from "./fechas";

type ConFechas = { inicio: string; fin: string };

/** Rango completo de meses que cubren las etapas, para dibujar diagramas de barras. */
export function rangoMeses(etapas: ConFechas[]) {
  const desde = etapas.reduce((m, e) => (e.inicio < m ? e.inicio : m), etapas[0].inicio);
  const hasta = etapas.reduce((m, e) => (e.fin > m ? e.fin : m), etapas[0].fin);
  const inicio = `${desde.slice(0, 7)}-01`;

  const meses: string[] = [];
  const d = new Date(`${inicio}T00:00:00Z`);
  while (d.toISOString().slice(0, 10) <= hasta) {
    meses.push(d.toISOString().slice(0, 10));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  d.setUTCDate(1);
  const fin = sumarDias(d.toISOString().slice(0, 10), -1);
  const total = diasEntre(inicio, fin) + 1;

  return {
    inicio,
    fin,
    meses,
    /** Posición de una fecha en % del ancho total. */
    pos: (f: string) => (diasEntre(inicio, f) / total) * 100,
    /** Ancho de una etapa en % del ancho total. */
    ancho: (e: ConFechas) => ((diasEntre(e.inicio, e.fin) + 1) / total) * 100,
  };
}

const mesFormat = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" });
const mesAnioFormat = new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" });

export function etiquetaMes(mes: string, conAnio: boolean) {
  return (conAnio ? mesAnioFormat : mesFormat).format(new Date(`${mes}T00:00:00Z`));
}
