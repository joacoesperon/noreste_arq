"use client";

// Lee una tabla desde Excel (.xlsx) o texto delimitado (.csv, .txt de Revit) en el navegador.
// Devuelve filas de celdas como texto. Las librerías se cargan recién al usarse.

function decodificar(buffer: ArrayBuffer): string {
  const b = new Uint8Array(buffer);
  // Revit suele exportar las tablas en UTF-16 con BOM.
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/** Saltea las filas de título del principio (Revit pone el nombre de la tabla arriba). */
function sinTitulos(filas: string[][]) {
  const inicio = filas.findIndex((f) => f.filter((c) => c.trim()).length >= 2);
  return inicio > 0 ? filas.slice(inicio) : filas;
}

export async function leerTabla(file: File): Promise<string[][]> {
  return sinTitulos(await leerFilas(file));
}

async function leerFilas(file: File): Promise<string[][]> {
  const nombre = file.name.toLowerCase();
  if (nombre.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    const filas = await readSheet(file);
    return filas.map((f) => f.map((c) => (c === null || c === undefined ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
  }
  if (nombre.endsWith(".xls")) throw new Error("El formato .xls viejo no se puede leer: guardalo como .xlsx o .csv.");
  if (nombre.endsWith(".pdf")) return leerPdf(file);

  const texto = decodificar(await file.arrayBuffer()).replace(/^﻿/, "");
  const Papa = (await import("papaparse")).default;
  const res = Papa.parse<string[]>(texto, { skipEmptyLines: "greedy" });
  return res.data.map((f) => f.map((c) => (c ?? "").trim()));
}

/**
 * Lista de precios en PDF: arma filas a partir de la posición del texto. Cada renglón es una
 * fila y las columnas se separan donde hay un espacio grande. Funciona con listas de columnas
 * fijas (código, descripción, IVA, precio); los renglones sin precio se saltean al importar.
 */
async function leerPdf(file: File): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const filas: string[][] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const contenido = await pagina.getTextContent();
    const items = contenido.items
      .filter((i): i is typeof i & { str: string; transform: number[]; width: number } => "str" in i && !!i.str.trim())
      .map((i) => ({ texto: i.str.trim(), x: i.transform[4], y: i.transform[5], fin: i.transform[4] + i.width }));
    // Agrupar por renglón (misma altura, con tolerancia)
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const renglones: (typeof items)[] = [];
    for (const it of items) {
      const r = renglones.at(-1);
      if (r && Math.abs(r[0].y - it.y) < 3) r.push(it);
      else renglones.push([it]);
    }
    for (const r of renglones) {
      r.sort((a, b) => a.x - b.x);
      const celdas: string[] = [];
      let fin = -Infinity;
      for (const it of r) {
        if (celdas.length && it.x - fin < 8) celdas[celdas.length - 1] += ` ${it.texto}`;
        else celdas.push(it.texto);
        fin = it.fin;
      }
      filas.push(celdas);
    }
  }
  // Empezar en la fila de encabezados (arriba suele haber fecha y título de la lista).
  const encabezado = filas.slice(0, 60).findIndex((f) => f.length >= 2 && f.some((c) => /descrip|precio|art[ií]culo/i.test(c)));
  return encabezado > 0 ? filas.slice(encabezado) : filas;
}

/** Columnas de la tabla (la más ancha de las primeras filas). */
export function cantidadColumnas(filas: string[][]) {
  return filas.slice(0, 50).reduce((m, f) => Math.max(m, f.length), 0);
}

/**
 * Filas de una tabla de cómputo de Revit con código y cantidad. Saltea lo que Revit agrega
 * al agrupar: filas de grupo (sin cantidad) y subtotales («C100: 14», «Total general: 14»).
 */
export function filasComputo(tabla: string[][], colCodigo: number, colCantidad: number, encabezado: boolean, parse: (v: string) => number | null) {
  const out: { codigo: string; cantidad: number }[] = [];
  for (const f of tabla.slice(encabezado ? 1 : 0)) {
    const codigo = (f[colCodigo] ?? "").trim();
    const cantidad = parse(f[colCantidad] ?? "");
    if (!codigo || cantidad === null) continue;
    if (codigo.includes(":") || /^total/i.test(codigo)) continue;
    out.push({ codigo, cantidad });
  }
  return out;
}
