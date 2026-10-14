import { finDe, sumarDias } from "./fechas";

// Modelo del estudio: «Etapas estimadas de dirección ejecutiva de obra» del cronograma de
// Casa Tots (docs/8). Duraciones de esa obra (17 meses en total), escaladas por m², tipología
// y plazos de cada obra; después se ajustan a mano.

export type TipoCronograma = "proyecto" | "obra";

type EtapaModelo = {
  nombre: string;
  /** Semanas desde el inicio del cronograma */
  desde: number;
  /** Semanas de duración (0 = hito) */
  semanas: number;
  clave?: boolean;
  /** Qué incluye (una línea por ítem) */
  detalle?: string;
};

const MES = 4.33;

const PROYECTO: EtapaModelo[] = [
  {
    nombre: "Anteproyecto",
    desde: 0,
    semanas: MES,
    detalle: [
      "Relevamiento y análisis del terreno: orientación, topografía, visuales, entorno, FOT/FOS, retiros",
      "Reunión inicial y definición del programa de necesidades",
      "Croquis preliminares, esquemas y renders de estudio. Ajustes y revisión con el cliente",
      "Propuesta arquitectónica: implantación, organización funcional, volumetría y criterios de diseño",
    ].join("\n"),
  },
  {
    nombre: "Proyecto",
    desde: MES,
    semanas: MES,
    clave: true,
    detalle: [
      "Planos arquitectónicos completos: plantas, cortes, vistas y detalles generales",
      "Cuadro de superficies y memoria descriptiva",
      "Planilla de carpinterías",
      "Planos de estructura (coordinación con calculista)",
      "Planos de instalaciones sanitarias, eléctricas y pluviales",
      "Detalles constructivos generales",
      "Documentación lista para gestión municipal",
    ].join("\n"),
  },
];

const OBRA: EtapaModelo[] = [
  {
    nombre: "Obra húmeda",
    desde: 0,
    semanas: 7 * MES,
    clave: true,
    detalle: [
      "Movimiento de suelos",
      "Fundaciones",
      "Estructura de hormigón y mampostería",
      "Revoques gruesos",
      "Contrapisos",
      "Instalaciones embutidas",
      "Cubierta estructural",
    ].join("\n"),
  },
  {
    nombre: "Terminaciones",
    desde: 7 * MES,
    semanas: 4 * MES,
    clave: true,
    detalle: [
      "Revoques finos",
      "Pintura interior y exterior",
      "Provisión y colocación de pisos",
      "Revestimientos interiores y exteriores",
      "Zócalos",
      "Provisión y colocación de aberturas",
      "Cielorrasos",
      "Terminaciones de cubierta",
      "Instalaciones completas",
      "Colocación de artefactos sanitarios",
      "Colocación de tableros, bocas de iluminación y tomas",
    ].join("\n"),
  },
  {
    nombre: "Equipamiento fijo",
    desde: 11 * MES,
    semanas: 3 * MES,
    detalle: [
      "Diseño, fabricación y colocación de mobiliario fijo: cocina, lavaderos y baños",
      "Colocación de carpinterías interiores",
      "Diseño, fabricación y colocación de placares",
      "Provisión y colocación de mesadas, bachas y griferías",
    ].join("\n"),
  },
  {
    nombre: "Semicubiertos",
    desde: 14 * MES,
    semanas: MES,
    clave: true,
    detalle: "Galerías, pérgolas, cocheras, solados exteriores y estructuras metálicas o de madera complementarias",
  },
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

export type EtapaGenerada = { nombre: string; inicio: string; fin: string; clave: boolean; detalle: string | null };

export function generarCronograma(tipo: TipoCronograma, datos: DatosModelo): EtapaGenerada[] {
  const modelo = MODELOS[tipo];
  const base = totalSemanas(modelo);
  const objetivo = datos.duracionMeses ? (datos.duracionMeses * 52) / 12 : base * factorSuperficie(tipo, datos.m2, datos.tipologia);
  const f = objetivo / base;

  return modelo.map((e) => {
    const inicio = sumarDias(datos.inicio, Math.round(e.desde * f) * 7);
    return {
      nombre: e.nombre,
      inicio,
      fin: finDe(inicio, e.semanas === 0 ? 0 : Math.max(e.semanas * f, 0.5)),
      clave: !!e.clave,
      detalle: e.detalle ?? null,
    };
  });
}
