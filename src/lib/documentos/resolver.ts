import type { JSONContent } from "@tiptap/core";
import { formatM2 } from "@/lib/obras/superficies";
import { semanasDe } from "@/lib/cronogramas/fechas";
import type { Bloque, DocumentoResuelto, FilaTabla, Run } from "./bloques";
import { labelDato, type ContextoDocumento } from "./datos";
import { ESTUDIO } from "./estudio";
import { MONEDAS, formatFechaCorta, formatFechaLarga, formatMonto, parseMonto, type Moneda } from "./formato";
import { SECCIONES_PRESUPUESTO, type Firmante, type ItemPresupuesto, type TipoDocumento } from "./tipos";

const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;
const SOLO_BLOQUE = /^\s*\{\{\s*(bloque\.\w+)\s*\}\}\s*$/;

type Entrada = {
  titulo: string;
  tipo: TipoDocumento;
  contenido: JSONContent;
  datos: Record<string, unknown>;
  contexto: ContextoDocumento;
};

/** Valor de los campos propios del documento ({{doc.*}}), ya formateado. */
function valorCampo(entrada: Entrada, key: string): { valor: string; opcional: boolean } | null {
  const campo = entrada.tipo.campos.find((c) => c.key === key);
  if (!campo) return null;
  const crudo = entrada.datos[key];
  const texto = typeof crudo === "string" ? crudo.trim() : crudo == null ? "" : String(crudo);
  const moneda = (entrada.datos.moneda as Moneda) || "ARS";
  let valor = texto;
  if (texto) {
    if (campo.tipo === "monto") {
      const n = parseMonto(texto);
      valor = n === null ? texto : formatMonto(n, moneda);
    } else if (campo.tipo === "fecha" && /^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      valor = formatFechaLarga(texto);
    } else if (campo.tipo === "moneda") {
      valor = MONEDAS.find((m) => m.value === texto)?.label ?? texto;
    }
  }
  return { valor, opcional: !!campo.opcional };
}

function resolverToken(entrada: Entrada, key: string): Run {
  if (key.startsWith("doc.")) {
    const r = valorCampo(entrada, key.slice(4));
    if (!r) return { texto: `[dato desconocido: ${key}]`, falta: true };
    if (!r.valor) return r.opcional ? { texto: "" } : { texto: `[falta: ${labelCampo(entrada, key.slice(4))}]`, falta: true };
    return { texto: r.valor };
  }
  if (key === "documento.titulo") return { texto: entrada.titulo };
  if (key === "documento.tipo") return { texto: entrada.tipo.nombre };
  const valor = entrada.contexto.valores[key];
  if (valor === undefined) return { texto: `[dato desconocido: ${key}]`, falta: true };
  if (!valor) return { texto: `[falta: ${labelDato(key)}]`, falta: true };
  return { texto: valor };
}

function labelCampo(entrada: Entrada, key: string) {
  return entrada.tipo.campos.find((c) => c.key === key)?.label ?? key;
}

/** Reemplaza los {{datos}} dentro de un texto, conservando el formato (negrita, etc.). */
function resolverTexto(entrada: Entrada, texto: string, marcas: Omit<Run, "texto">): Run[] {
  const runs: Run[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(TOKEN)) {
    if (m.index! > ultimo) runs.push({ texto: texto.slice(ultimo, m.index), ...marcas });
    const r = resolverToken(entrada, m[1]);
    runs.push({ ...marcas, ...r });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < texto.length) runs.push({ texto: texto.slice(ultimo), ...marcas });
  return runs;
}

function inline(entrada: Entrada, nodos: JSONContent[] = []): Run[] {
  const runs: Run[] = [];
  for (const n of nodos) {
    if (n.type === "hardBreak") {
      runs.push({ texto: "\n" });
    } else if (n.type === "text" && n.text) {
      const marcas = {
        b: n.marks?.some((m) => m.type === "bold") || undefined,
        i: n.marks?.some((m) => m.type === "italic") || undefined,
        u: n.marks?.some((m) => m.type === "underline") || undefined,
      };
      runs.push(...resolverTexto(entrada, n.text, marcas));
    }
  }
  return runs;
}

const textoPlano = (nodos: JSONContent[] = []) => nodos.map((n) => (n.type === "text" ? (n.text ?? "") : "")).join("");
const vacio = (runs: Run[]) => runs.every((r) => !r.texto.trim());

function itemsLista(entrada: Entrada, lista: JSONContent): Run[][] {
  const items: Run[][] = [];
  for (const li of lista.content ?? []) {
    const runs: Run[] = [];
    for (const hijo of li.content ?? []) {
      if (hijo.type === "paragraph") {
        if (runs.length) runs.push({ texto: " " });
        runs.push(...inline(entrada, hijo.content));
      } else if (hijo.type === "bulletList" || hijo.type === "orderedList") {
        // Las sublistas se aplanan: Word y PDF las muestran como ítems siguientes.
        items.push(runs.splice(0));
        items.push(...itemsLista(entrada, hijo));
      }
    }
    if (runs.length) items.push(runs);
  }
  return items.filter((i) => !vacio(i));
}

const faltaBloque = (texto: string): Bloque => ({ t: "parrafo", runs: [{ texto: `[falta: ${texto}]`, falta: true }] });

function expandirBloque(entrada: Entrada, key: string): Bloque[] {
  const ctx = entrada.contexto;
  switch (key) {
    case "bloque.servicios":
      return ctx.servicios.length
        ? [{ t: "lista", ordenada: false, items: ctx.servicios.map((s) => [{ texto: s }]) }]
        : [faltaBloque("servicios contratados (ficha de la obra)")];

    case "bloque.especialidades":
      return ctx.especialidades.length
        ? [
            {
              t: "tabla",
              columnas: ["Especialidad", "Responsable"],
              filas: ctx.especialidades.map((e) => ({ celdas: [e.especialidad, e.responsable ?? "A definir"] })),
            },
          ]
        : [faltaBloque("especialidades (ficha de la obra)")];

    case "bloque.superficies": {
      const s = ctx.superficies;
      if (s.total <= 0) return [faltaBloque("superficies (ficha de la obra)")];
      const filas: FilaTabla[] = [
        ...s.sectores.map((x) => ({ celdas: [x.nombre, formatM2(x.total)] })),
        { celdas: ["Cubierta", formatM2(s.cubierta)], tipo: s.sectores.length ? ("subtotal" as const) : undefined },
        { celdas: ["Semicubierta", formatM2(s.semicubierta)] },
        { celdas: ["Descubierta", formatM2(s.descubierta)] },
        { celdas: ["Total", formatM2(s.total)], tipo: "total" },
      ];
      return [{ t: "tabla", columnas: ["Superficie", "m²"], filas, derecha: [1] }];
    }

    case "bloque.presupuesto": {
      const moneda = (entrada.datos.moneda as Moneda) || "ARS";
      const items = ((entrada.datos.items as ItemPresupuesto[]) ?? []).filter((i) => i.concepto?.trim() || i.monto?.trim());
      if (!items.length) return [faltaBloque("ítems del presupuesto")];
      const filas: FilaTabla[] = [];
      let total = 0;
      const secciones = [...SECCIONES_PRESUPUESTO, ...new Set(items.map((i) => i.seccion))].filter(
        (s, i, arr) => arr.indexOf(s) === i
      );
      for (const seccion of secciones) {
        const deSeccion = items.filter((i) => i.seccion === seccion);
        if (!deSeccion.length) continue;
        filas.push({ celdas: [seccion, ""], tipo: "seccion" });
        let subtotal = 0;
        for (const i of deSeccion) {
          const n = parseMonto(i.monto ?? "") ?? 0;
          subtotal += n;
          filas.push({ celdas: [i.concepto || "—", formatMonto(n, moneda)] });
        }
        filas.push({ celdas: [`Subtotal ${seccion.toLowerCase()}`, formatMonto(subtotal, moneda)], tipo: "subtotal" });
        total += subtotal;
      }
      filas.push({ celdas: ["Total", formatMonto(total, moneda)], tipo: "total" });
      return [{ t: "tabla", columnas: ["Concepto", `Monto (${moneda})`], filas, derecha: [1] }];
    }

    case "bloque.cronograma_proyecto":
    case "bloque.cronograma_obra": {
      const tipo = key === "bloque.cronograma_proyecto" ? "proyecto" : "obra";
      const etapas = ctx.cronogramas[tipo];
      if (!etapas.length) return [faltaBloque(`cronograma de ${tipo} (pestaña Cronogramas de la obra)`)];
      return [
        { t: "gantt", etapas },
        {
          t: "tabla",
          columnas: ["Etapa", "Inicio", "Fin", "Semanas"],
          filas: etapas.map((e) => ({
            celdas: [
              e.clave ? `${e.nombre} •` : e.nombre,
              formatFechaCorta(e.inicio),
              formatFechaCorta(e.fin),
              e.inicio === e.fin ? "hito" : semanasDe(e.inicio, e.fin).toLocaleString("es-AR"),
            ],
          })),
          derecha: [3],
        },
      ];
    }

    case "bloque.firmas": {
      const firmantes: Firmante[] = entrada.tipo.firmantes ?? ["cliente", "estudio"];
      const nombre = (f: Firmante) =>
        f === "estudio"
          ? ESTUDIO.nombre
          : f === "cliente"
            ? ctx.valores["cliente.nombre"] || "Comitente"
            : String(entrada.datos.contraparte_nombre ?? "").trim() || "Contraparte";
      const rol = (f: Firmante) => (f === "estudio" ? "Por el estudio" : f === "cliente" ? "Comitente" : "Contraparte");
      return [{ t: "firmas", partes: firmantes.map((f) => ({ rol: rol(f), nombre: nombre(f) })) }];
    }

    default:
      return [{ t: "parrafo", runs: [{ texto: `[bloque desconocido: ${key}]`, falta: true }] }];
  }
}

/** Plantilla + datos → documento listo para mostrar o exportar. */
export function resolverDocumento(entrada: Entrada): DocumentoResuelto {
  const bloques: Bloque[] = [];

  for (const nodo of entrada.contenido.content ?? []) {
    switch (nodo.type) {
      case "heading": {
        const runs = inline(entrada, nodo.content);
        if (!vacio(runs)) bloques.push({ t: "titulo", nivel: Math.min(Math.max(nodo.attrs?.level ?? 2, 1), 3) as 1 | 2 | 3, runs });
        break;
      }
      case "paragraph": {
        const bloque = textoPlano(nodo.content).match(SOLO_BLOQUE);
        if (bloque) {
          bloques.push(...expandirBloque(entrada, bloque[1]));
          break;
        }
        const runs = inline(entrada, nodo.content);
        // Un párrafo que solo tenía datos opcionales vacíos desaparece.
        if (!vacio(runs) || !TOKEN.test(textoPlano(nodo.content))) bloques.push({ t: "parrafo", runs });
        TOKEN.lastIndex = 0;
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = itemsLista(entrada, nodo);
        if (items.length) bloques.push({ t: "lista", ordenada: nodo.type === "orderedList", items });
        break;
      }
      case "horizontalRule":
        bloques.push({ t: "separador" });
        break;
    }
  }

  return { titulo: entrada.titulo, bloques };
}
