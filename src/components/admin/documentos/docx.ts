import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type ISectionOptions,
  type ParagraphChild,
} from "docx";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import type { Membrete } from "@/lib/documentos/estudio";
import { etiquetaMes, rangoMeses } from "@/lib/cronogramas/rango";

// Word editable (pregunta 11) con el diseño de la plantilla NE26 y los colores del manual.
// El diagrama de barras se arma como tabla con celdas sombreadas por mes.

const FUENTE = "Helvetica";
const TINTA = "181818";
const GRIS = "555555";
const LINEA = "C0C0C4";
const FONDO = "F8F8F8";
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDE_FINO = { style: BorderStyle.SINGLE, size: 4, color: LINEA };
const BORDE_FUERTE = { style: BorderStyle.SINGLE, size: 8, color: TINTA };
const SIN_BORDES = { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE };

export type ImagenesMarca = { logo: ArrayBuffer | null; isotipo: ArrayBuffer | null };

function runs(rs: Run[], negrita = false): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const r of rs) {
    r.texto.split("\n").forEach((parte, i) =>
      out.push(
        new TextRun({
          text: parte,
          break: i > 0 ? 1 : undefined,
          bold: r.b || negrita || undefined,
          italics: r.i,
          underline: r.u ? {} : undefined,
          highlight: r.falta ? "yellow" : undefined,
        })
      )
    );
  }
  return out;
}

function celda(texto: string, opciones: { bold?: boolean; derecha?: boolean; color?: string; fondo?: string; ancho?: number; borde?: "fino" | "fuerte" } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: opciones.derecha ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: texto, bold: opciones.bold, color: opciones.color, size: 18 })],
      }),
    ],
    width: opciones.ancho ? { size: opciones.ancho, type: WidthType.PERCENTAGE } : undefined,
    shading: opciones.fondo ? { type: ShadingType.CLEAR, color: "auto", fill: opciones.fondo } : undefined,
    borders: { top: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, bottom: opciones.borde === "fuerte" ? BORDE_FUERTE : BORDE_FINO },
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
                fondo: f.tipo === "seccion" ? FONDO : undefined,
                ancho: ancho(j),
                borde: f.tipo === "total" ? "fuerte" : "fino",
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
                return celda("", { ancho: anchoMes, fondo: activa ? (e.clave || e.inicio === e.fin ? "F59E0B" : GRIS) : undefined });
              }),
            ],
          })
      ),
    ],
  });
}

function firmas(b: Extract<Bloque, { t: "firmas" }>) {
  const porFila = 2;
  const filas: (typeof b.partes)[] = [];
  for (let i = 0; i < b.partes.length; i += porFila) filas.push(b.partes.slice(i, i + porFila));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SIN_BORDES,
    rows: filas.map(
      (fila) =>
        new TableRow({
          cantSplit: true,
          children: fila.map(
            (p) =>
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
                margins: { left: 300, right: 300 },
                children: [
                  new Paragraph({
                    spacing: { before: 1100 },
                    border: { top: { style: BorderStyle.SINGLE, size: 6, color: TINTA, space: 4 } },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: p.nombre, bold: true })],
                  }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.rol, color: GRIS, size: 16 })] }),
                ],
              })
          ),
        })
    ),
  });
}

/** Contrato bilingüe: tabla sin bordes, una columna por idioma. */
function columnas(b: Extract<Bloque, { t: "columnas" }>, numeracion: { n: number }) {
  const n = b.filas.reduce((m, f) => Math.max(m, f.length), 1);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SIN_BORDES,
    rows: b.filas.map(
      (fila) =>
        new TableRow({
          children: Array.from({ length: n }, (_, j) => {
            const contenido = bloques(fila[j] ?? [], numeracion).filter((x): x is Paragraph => x instanceof Paragraph);
            return new TableCell({
              width: { size: Math.floor(100 / n), type: WidthType.PERCENTAGE },
              borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
              margins: { left: j === 0 ? 0 : 160, right: j === n - 1 ? 0 : 160 },
              children: contenido.length ? contenido : [new Paragraph({})],
            });
          }),
        })
    ),
  });
}

function bloques(bs: Bloque[], numeracion: { n: number }): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of bs) {
    switch (b.t) {
      case "titulo":
        out.push(
          new Paragraph({
            heading: b.nivel === 1 ? HeadingLevel.HEADING_1 : b.nivel === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            keepNext: true,
            children: runs(b.runs, true),
          })
        );
        break;
      case "parrafo":
        out.push(new Paragraph({ children: runs(b.runs) }));
        break;
      case "lista":
        numeracion.n++;
        for (const item of b.items) {
          out.push(
            new Paragraph({
              children: runs(item),
              ...(b.ordenada ? { numbering: { reference: "numerada", level: 0, instance: numeracion.n } } : { bullet: { level: 0 } }),
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
      case "columnas":
        out.push(columnas(b, numeracion));
        break;
      case "separador":
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINEA, space: 4 } } }));
        break;
      case "portada":
      case "contratapa":
        break;
    }
  }
  return out;
}

const PAGINA = { size: { width: 11906, height: 16838 }, margin: { top: 2100, bottom: 1500, left: 1040, right: 1040, header: 640, footer: 560 } };

export function documentoDocx(documento: DocumentoResuelto, membrete: Membrete, fecha: string, imagenes: ImagenesMarca) {
  const portada = documento.bloques.find((b) => b.t === "portada");
  const contratapa = documento.bloques.some((b) => b.t === "contratapa");
  const cuerpo = documento.bloques.filter((b) => b.t !== "portada" && b.t !== "contratapa");
  const gris = (text: string, extra: Partial<ConstructorParameters<typeof TextRun>[0] & object> = {}) =>
    new TextRun({ text, color: GRIS, size: 16, ...extra });

  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: SIN_BORDES,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [fecha, membrete.instagram, membrete.email].map(
                  (t) => new Paragraph({ spacing: { after: 0, line: 260 }, children: [gris(t)] })
                ),
              }),
              new TableCell({
                borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      imagenes.logo
                        ? new ImageRun({ type: "png", data: imagenes.logo, transformation: { width: 128, height: 53 } })
                        : new TextRun({ text: "noreste ARQ.", bold: true, size: 32 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const footer = new Footer({
    children: membrete.telefonos.map(
      (t, i) =>
        new Paragraph({
          spacing: { after: 0, line: 240 },
          tabStops: [{ type: TabStopType.RIGHT, position: 9800 }],
          children: [
            gris(`${t.numero} | ${t.nombre}`, { size: 15 }),
            ...(i === membrete.telefonos.length - 1 ? [gris("", { size: 15, children: ["\t", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES] })] : []),
          ],
        })
    ),
  });

  const sections: ISectionOptions[] = [];
  const isotipo = (ancho: number) =>
    imagenes.isotipo ? [new ImageRun({ type: "png", data: imagenes.isotipo, transformation: { width: ancho, height: Math.round(ancho * 1.044) } })] : [];

  if (portada?.t === "portada") {
    sections.push({
      properties: { page: PAGINA, titlePage: false },
      children: [
        new Paragraph({ spacing: { before: 3600 }, alignment: AlignmentType.CENTER, children: isotipo(120) }),
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: portada.titulo, bold: true, size: 32 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [gris(portada.subtitulo, { size: 18 })] }),
      ],
    });
  }

  sections.push({
    properties: { page: PAGINA },
    headers: { default: header },
    footers: { default: footer },
    children: bloques(cuerpo, { n: 0 }),
  });

  if (contratapa) {
    sections.push({
      properties: { page: PAGINA, verticalAlign: VerticalAlign.CENTER },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "muchas gracias!", bold: true, size: 30 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [gris(membrete.email, { size: 18 })] }),
        new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: isotipo(36) }),
      ],
    });
  }

  return new Document({
    creator: membrete.nombre,
    title: documento.titulo,
    styles: {
      default: {
        document: { run: { font: FUENTE, size: 20, color: TINTA }, paragraph: { spacing: { after: 100, line: 300 } } },
        heading1: { run: { font: FUENTE, size: 34, bold: true, color: TINTA }, paragraph: { spacing: { before: 0, after: 160 } } },
        heading2: { run: { font: FUENTE, size: 24, bold: true, color: TINTA }, paragraph: { spacing: { before: 240, after: 80 } } },
        heading3: { run: { font: FUENTE, size: 21, bold: true, color: TINTA }, paragraph: { spacing: { before: 160, after: 40 } } },
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
    sections,
  });
}
