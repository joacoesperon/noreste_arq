// Representación intermedia de un documento ya resuelto (con los datos de la obra).
// Es lo que se guarda en cada versión y lo que leen los tres formatos de salida:
// vista previa (HTML), PDF y Word.

export type Run = { texto: string; b?: boolean; i?: boolean; u?: boolean; falta?: boolean };

export type FilaTabla = { celdas: string[]; tipo?: "seccion" | "subtotal" | "total" };

export type EtapaBloque = { nombre: string; inicio: string; fin: string; clave: boolean };

export type Bloque =
  | { t: "titulo"; nivel: 1 | 2 | 3; runs: Run[] }
  | { t: "parrafo"; runs: Run[] }
  | { t: "lista"; ordenada: boolean; items: Run[][] }
  | { t: "tabla"; columnas: string[]; filas: FilaTabla[]; derecha?: number[] }
  | { t: "gantt"; etapas: EtapaBloque[] }
  | { t: "firmas"; partes: { rol: string; nombre: string }[] }
  | { t: "separador" };

export type DocumentoResuelto = {
  titulo: string;
  bloques: Bloque[];
};

/** Datos faltantes del documento, para avisar antes de exportar. */
export function faltantes(bloques: Bloque[]): string[] {
  const out = new Set<string>();
  const revisar = (runs: Run[]) => runs.forEach((r) => r.falta && out.add(r.texto.replace(/^\[falta: |\]$/g, "")));
  for (const b of bloques) {
    if (b.t === "titulo" || b.t === "parrafo") revisar(b.runs);
    if (b.t === "lista") b.items.forEach(revisar);
  }
  return [...out];
}
