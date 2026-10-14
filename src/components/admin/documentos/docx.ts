import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import { ESTUDIO } from "@/lib/documentos/estudio";
import { etiquetaMes, rangoMeses } from "@/lib/cronogramas/rango";

// Word editable (pregunta 11). Mismo contenido que el PDF; el diagrama de barras
// se arma como tabla con celdas sombreadas por mes para que siga siendo editable.

const FUENTE = "Helvetica";
const GRIS = "737373";
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDE_FINO = { style: BorderStyle.SINGLE, size: 4, color: "D4D4D4" };
const BORDE_FUERTE = { style: BorderStyle.SINGLE, size: 8, color: "171717" };

function runs(rs: Run[]): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const r of rs) {
    r.texto.split("\n").forEach((parte, i) =>
      out.push(
        new TextRun({
          text: parte,
          break: i > 0 ? 1 : undefined,
          bold: r.b,
          italics: r.i,
          underline: r.u ? {} : undefined,
          highlight: r.falta ? "yellow" : undefined,
        })
      )
    );
  }
  return out;
}

function celda(texto: string, opciones: { bold?: boolean; derecha?: boolean; color?: string; fondo?: string; ancho?: number; borde?: "fino" | "fuerte" | "ninguno" } = {}) {
  const borde = opciones.borde === "fuerte" ? BORDE_FUERTE : opciones.borde === "ninguno" ? SIN_BORDE : BORDE_FINO;
  return new TableCell({
    children: [
      new Paragraph({
        alignment: opciones.derecha ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: texto, bold: opciones.bold, color: opciones.color, size: 18 })],
      }),
    ],
    width: opciones.ancho ? { size: opciones.ancho, type: WidthType.PERCENTAGE } : undefined,
    shading: opciones.fondo ? { type: ShadingType.CLEAR, color: "auto", fill: opciones.fondo } : undefined,
    borders: { top: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, bottom: borde },
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });
}

function tabla(b: Extract<Bloque, { t: "tabla" }>) {
  const ancho = (j: number) => (j === 0 ? Math.round(100 - (b.columnas.length - 1) * 20) : 20);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: b.columnas.map((c, j) => celda(c, { bold: true, derecha: b.derecha?.includes(j), ancho: ancho(j), borde: "fuerte" })),
      }),
      ...b.filas.map(
        (f) =>
          new TableRow({
            cantSplit: true,
            children: f.celdas.map((c, j) =>
              celda(c, {
                bold: f.tipo === "seccion" || f.tipo === "total",
                derecha: b.derecha?.includes(j),
                color: f.tipo === "subtotal" ? GRIS : undefined,
                fondo: f.tipo === "seccion" ? "F5F5F5" : undefined,
                ancho: ancho(j),
              })
            ),
          })
      ),
    ],
  });
}

function gantt(b: Extract<Bloque, { t: "gantt" }>) {
  const r = rangoMeses(b.etapas);
  const conAnio = r.inicio.slice(0, 4) !== r.fin.slice(0, 4);
  const anchoMes = Math.max(Math.floor(68 / r.meses.length), 1);
  const finDeMes = (m: string) => {
    const d = new Date(`${m}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          celda("Etapa", { bold: true, ancho: 32, borde: "fuerte" }),
          ...r.meses.map((m) => celda(etiquetaMes(m, conAnio), { color: GRIS, ancho: anchoMes, borde: "fuerte" })),
        ],
      }),
      ...b.etapas.map(
        (e) =>
          new TableRow({
            cantSplit: true,
            children: [
              celda(e.clave ? `${e.nombre} •` : e.nombre, { ancho: 32 }),
              ...r.meses.map((m) => {
                const activa = e.inicio <= finDeMes(m) && e.fin >= m;
                return celda("", { ancho: anchoMes, fondo: activa ? (e.clave || e.inicio === e.fin ? "F59E0B" : "404040") : undefined });
              }),
            ],
          })
      ),
    ],
  });
}

function firmas(b: Extract<Bloque, { t: "firmas" }>) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
    rows: [
      new TableRow({
        children: b.partes.map(
          (p) =>
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
              margins: { left: 300, right: 300 },
              children: [
                new Paragraph({ spacing: { before: 1200 }, border: { top: { style: BorderStyle.SINGLE, size: 6, color: "171717", space: 4 } }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.nombre, bold: true })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.rol, color: GRIS, size: 16 })] }),
              ],
            })
        ),
      }),
    ],
  });
}

function bloques(bs: Bloque[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  let listaNumerada = 0;
  for (const b of bs) {
    switch (b.t) {
      case "titulo":
        out.push(
          new Paragraph({
            heading: b.nivel === 1 ? HeadingLevel.HEADING_1 : b.nivel === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            keepNext: true,
            children: runs(b.runs),
          })
        );
        break;
      case "parrafo":
        out.push(new Paragraph({ children: runs(b.runs) }));
        break;
      case "lista":
        listaNumerada++;
        for (const item of b.items) {
          out.push(
            new Paragraph({
              children: runs(item),
              ...(b.ordenada
                ? { numbering: { reference: "numerada", level: 0, instance: listaNumerada } }
                : { bullet: { level: 0 } }),
            })
          );
        }
        break;
      case "tabla":
        out.push(tabla(b), new Paragraph({}));
        break;
      case "gantt":
        out.push(gantt(b), new Paragraph({}));
        break;
      case "firmas":
        out.push(firmas(b));
        break;
      case "separador":
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D4D4D4", space: 4 } } }));
        break;
    }
  }
  return out;
}

export function documentoDocx(documento: DocumentoResuelto) {
  return new Document({
    creator: ESTUDIO.nombre,
    title: documento.titulo,
    styles: {
      default: {
        document: { run: { font: FUENTE, size: 20, color: "171717" }, paragraph: { spacing: { after: 100, line: 300 } } },
        heading1: { run: { font: FUENTE, size: 36, bold: true, color: "171717" }, paragraph: { spacing: { before: 120, after: 160 } } },
        heading2: { run: { font: FUENTE, size: 23, bold: true, color: "171717" }, paragraph: { spacing: { before: 280, after: 100 } } },
        heading3: { run: { font: FUENTE, size: 21, bold: true, color: "171717" }, paragraph: { spacing: { before: 200, after: 80 } } },
      },
    },
    numbering: {
      config: [
        {
          reference: "numerada",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 400, hanging: 280 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1200, right: 1200 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9500 }],
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D4D4D4", space: 4 } },
                children: [
                  // Marca en texto hasta recibir el logo en vector.
                  new TextRun({ text: "noreste ", bold: true, size: 22 }),
                  new TextRun({ text: "ARQ", size: 14 }),
                  new TextRun({ text: `\t${ESTUDIO.nombre.toUpperCase()}`, color: GRIS, size: 14 }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9500 }],
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: "D4D4D4", space: 4 } },
                children: [
                  new TextRun({ text: `${ESTUDIO.nombre} · ${ESTUDIO.email} · ${ESTUDIO.telefono}`, color: GRIS, size: 14 }),
                  new TextRun({ children: ["\t", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], color: GRIS, size: 14 }),
                ],
              }),
            ],
          }),
        },
        children: bloques(documento.bloques),
      },
    ],
  });
}
