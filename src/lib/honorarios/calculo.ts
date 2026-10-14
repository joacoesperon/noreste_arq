// Cálculo de honorarios del estudio (planilla «NE - CAJA», hoja Calculo Honorarios).
// Honorario de proyecto y dirección = costo de obra × porcentaje según superficie; se reparte
// entre proyecto y dirección, el proyecto en anteproyecto / municipal / ejecutivo, y la
// dirección ejecutiva vale el doble que la dirección. Por último se suma el IVA.
// Los valores se pueden cambiar desde Plantillas → Honorarios (tabla `estudio_config.honorarios`).

export type Tramo = {
  /** Hasta cuántos m² (menos de). null = sin límite. */
  hasta: number | null;
  porcentaje: number;
};

export type ClaveCategoria = "reforma" | "vivienda" | "otros";

export type CategoriaHonorarios = {
  clave: ClaveCategoria;
  nombre: string;
  tramos: Tramo[];
  /** Porcentaje del honorario que corresponde al proyecto; el resto es dirección. */
  proyecto: number;
};

export type ConfigHonorarios = {
  categorias: CategoriaHonorarios[];
  /** Reparto del proyecto, en %. */
  anteproyecto: number;
  municipal: number;
  ejecutivo: number;
  /** La dirección ejecutiva es la dirección por este factor. */
  factorEjecutiva: number;
  iva: number;
};

export const HONORARIOS_BASE: ConfigHonorarios = {
  categorias: [
    {
      clave: "reforma",
      nombre: "Reforma / intervención",
      tramos: [
        { hasta: 50, porcentaje: 10 },
        { hasta: 150, porcentaje: 13.33 },
        { hasta: 250, porcentaje: 14.33 },
        { hasta: null, porcentaje: 15.33 },
      ],
      proyecto: 40,
    },
    {
      clave: "vivienda",
      nombre: "Obra nueva de vivienda",
      tramos: [
        { hasta: 50, porcentaje: 10 },
        { hasta: 250, porcentaje: 13.33 },
        { hasta: 350, porcentaje: 14.33 },
        { hasta: null, porcentaje: 15.33 },
      ],
      proyecto: 60,
    },
    {
      // Respuesta del estudio: más de 500 m² que no son vivienda, 4,5 % del costo de obra.
      clave: "otros",
      nombre: "Obra nueva (no vivienda)",
      tramos: [
        { hasta: 50, porcentaje: 10 },
        { hasta: 250, porcentaje: 13.33 },
        { hasta: 350, porcentaje: 14.33 },
        { hasta: 500, porcentaje: 15.33 },
        { hasta: null, porcentaje: 4.5 },
      ],
      proyecto: 60,
    },
  ],
  anteproyecto: 20,
  municipal: 30,
  ejecutivo: 50,
  factorEjecutiva: 2,
  iva: 21,
};

/** Configuración guardada completada con la base (si falta algo o está mal, se usa la base). */
export function configHonorarios(guardado: unknown): ConfigHonorarios {
  const g = (guardado ?? {}) as Partial<ConfigHonorarios>;
  const num = (v: unknown, def: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : def);
  const categorias = HONORARIOS_BASE.categorias.map((base) => {
    const c = Array.isArray(g.categorias) ? g.categorias.find((x) => x?.clave === base.clave) : undefined;
    const tramos =
      c && Array.isArray(c.tramos) && c.tramos.length
        ? c.tramos
            .filter((t) => typeof t?.porcentaje === "number")
            .map((t) => ({ hasta: typeof t.hasta === "number" && t.hasta > 0 ? t.hasta : null, porcentaje: t.porcentaje }))
        : base.tramos;
    return { ...base, tramos: ordenarTramos(tramos), proyecto: num(c?.proyecto, base.proyecto) };
  });
  return {
    categorias,
    anteproyecto: num(g.anteproyecto, HONORARIOS_BASE.anteproyecto),
    municipal: num(g.municipal, HONORARIOS_BASE.municipal),
    ejecutivo: num(g.ejecutivo, HONORARIOS_BASE.ejecutivo),
    factorEjecutiva: num(g.factorEjecutiva, HONORARIOS_BASE.factorEjecutiva),
    iva: num(g.iva, HONORARIOS_BASE.iva),
  };
}

/** De menor a mayor superficie; el tramo sin límite al final (uno solo). */
export function ordenarTramos(tramos: Tramo[]): Tramo[] {
  const conLimite = tramos.filter((t) => t.hasta !== null).sort((a, b) => a.hasta! - b.hasta!);
  const sinLimite = tramos.find((t) => t.hasta === null);
  return sinLimite ? [...conLimite, sinLimite] : conLimite;
}

/** Categoría según la tipología de la obra. */
export function categoriaDeTipologia(tipologia: string | null | undefined): ClaveCategoria {
  if (!tipologia) return "vivienda";
  if (/reforma/i.test(tipologia)) return "reforma";
  if (/vivienda/i.test(tipologia)) return "vivienda";
  return "otros";
}

export function porcentajeDe(categoria: CategoriaHonorarios, m2: number): number {
  const tramo = categoria.tramos.find((t) => t.hasta === null || m2 < t.hasta) ?? categoria.tramos.at(-1);
  return tramo?.porcentaje ?? 0;
}

export type ResultadoHonorarios = {
  porcentaje: number;
  anteproyecto: number;
  municipal: number;
  ejecutivo: number;
  proyecto: number;
  direccion: number;
  direccionEjecutiva: number;
  proyectoDireccion: number;
  proyectoDireccionEjecutiva: number;
};

/** Montos con o sin IVA, redondeados a dos decimales. */
export function calcularHonorarios(
  config: ConfigHonorarios,
  clave: ClaveCategoria,
  m2: number,
  costoObra: number,
  conIva: boolean
): ResultadoHonorarios {
  const categoria = config.categorias.find((c) => c.clave === clave) ?? config.categorias[0];
  const porcentaje = porcentajeDe(categoria, m2);
  const factor = conIva ? 1 + config.iva / 100 : 1;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const honorario = costoObra * (porcentaje / 100);
  const proyecto = honorario * (categoria.proyecto / 100) * factor;
  const direccion = honorario * (1 - categoria.proyecto / 100) * factor;
  const direccionEjecutiva = direccion * config.factorEjecutiva;
  return {
    porcentaje,
    anteproyecto: r2((proyecto * config.anteproyecto) / 100),
    municipal: r2((proyecto * config.municipal) / 100),
    ejecutivo: r2((proyecto * config.ejecutivo) / 100),
    proyecto: r2(proyecto),
    direccion: r2(direccion),
    direccionEjecutiva: r2(direccionEjecutiva),
    proyectoDireccion: r2(proyecto + direccion),
    proyectoDireccionEjecutiva: r2(proyecto + direccionEjecutiva),
  };
}
