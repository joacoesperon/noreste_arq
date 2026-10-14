import { finDe, sumarDias } from "./fechas";

// Etapas de la pregunta 10 (Noreste_Modificaciones_Web_v1.pdf). Las duraciones son un
// MODELO PROVISORIO (vivienda de ~200 m²) hasta recibir un cronograma real del estudio:
// se escalan con los m², la tipología y los plazos cargados en la obra, y después se ajustan a mano.

export type TipoCronograma = "proyecto" | "obra";

type EtapaModelo = {
  nombre: string;
  /** Semanas desde el inicio del cronograma */
  desde: number;
  /** Semanas de duración (0 = hito) */
  semanas: number;
  clave?: boolean;
};

const PROYECTO: EtapaModelo[] = [
  { nombre: "Programa de necesidades y alcance", desde: 0, semanas: 2 },
  { nombre: "Propuesta de servicios y croquis preliminares", desde: 2, semanas: 2, clave: true },
  { nombre: "Anteproyecto", desde: 4, semanas: 5 },
  { nombre: "Revisión del anteproyecto", desde: 9, semanas: 2, clave: true },
  { nombre: "Proyecto ejecutivo", desde: 11, semanas: 10, clave: true },
  { nombre: "Cotizaciones", desde: 21, semanas: 3 },
  { nombre: "Concurso de ofertas", desde: 24, semanas: 3 },
  { nombre: "Firma de constructor y contratos de construcción", desde: 27, semanas: 0, clave: true },
  { nombre: "Cronograma de obra y planificación", desde: 27, semanas: 2 },
  { nombre: "Comienzo de las etapas de obra", desde: 29, semanas: 0, clave: true },
];

const OBRA: EtapaModelo[] = [
  { nombre: "Trabajos preliminares", desde: 0, semanas: 3 },
  { nombre: "Movimiento de suelos", desde: 2, semanas: 3 },
  { nombre: "Prefabricación en fábrica", desde: 4, semanas: 8 },
  { nombre: "Albañilería", desde: 5, semanas: 22 },
  { nombre: "Instalaciones sanitarias, eléctricas, HVAC y especialidades", desde: 12, semanas: 22 },
  { nombre: "Terminaciones", desde: 30, semanas: 16 },
  { nombre: "Puesta en marcha y plazo de garantía", desde: 46, semanas: 4, clave: true },
  { nombre: "Relevamiento final de la obra completada", desde: 50, semanas: 2, clave: true },
];

export const MODELOS: Record<TipoCronograma, EtapaModelo[]> = { proyecto: PROYECTO, obra: OBRA };

const totalSemanas = (modelo: EtapaModelo[]) => Math.max(...modelo.map((e) => e.desde + e.semanas));

export type DatosModelo = {
  inicio: string;
  m2: number;
  tipologia: string | null;
  /** Duración cargada en la obra (meses); si está, el cronograma se ajusta a ese plazo. */
  duracionMeses: number | null;
};

/** Factor de escala por superficie: obras más grandes llevan más tiempo (no linealmente). */
function factorSuperficie(tipo: TipoCronograma, m2: number, tipologia: string | null) {
  if (m2 <= 0) return 1;
  const exponente = tipo === "obra" ? 0.5 : 0.35;
  let f = Math.pow(m2 / 200, exponente);
  if (tipologia === "Reforma") f *= 0.6;
  return Math.min(Math.max(f, 0.6), 2.5);
}

export type EtapaGenerada = { nombre: string; inicio: string; fin: string; clave: boolean };

export function generarCronograma(tipo: TipoCronograma, datos: DatosModelo): EtapaGenerada[] {
  const modelo = MODELOS[tipo];
  const base = totalSemanas(modelo);
  const objetivo = datos.duracionMeses ? (datos.duracionMeses * 52) / 12 : base * factorSuperficie(tipo, datos.m2, datos.tipologia);
  const f = objetivo / base;

  return modelo.map((e) => {
    const inicio = sumarDias(datos.inicio, Math.round(e.desde * f) * 7);
    return { nombre: e.nombre, inicio, fin: finDe(inicio, e.semanas === 0 ? 0 : Math.max(e.semanas * f, 0.5)), clave: !!e.clave };
  });
}
