import type { JSONContent } from "@tiptap/core";

// Conversor mínimo de texto con formato simple a documento TipTap, para escribir
// las plantillas base en el código. Soporta: # / ## / ### títulos, "- " y "1. " listas,
// "---" separador, **negrita**, *cursiva*. Líneas vacías separan párrafos.

function marcas(linea: string): JSONContent[] {
  const out: JSONContent[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let ultimo = 0;
  for (const m of linea.matchAll(re)) {
    if (m.index! > ultimo) out.push({ type: "text", text: linea.slice(ultimo, m.index) });
    const negrita = m[0].startsWith("**");
    out.push({
      type: "text",
      text: m[0].slice(negrita ? 2 : 1, negrita ? -2 : -1),
      marks: [{ type: negrita ? "bold" : "italic" }],
    });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < linea.length) out.push({ type: "text", text: linea.slice(ultimo) });
  return out;
}

const parrafo = (linea: string): JSONContent => ({ type: "paragraph", content: marcas(linea) });

export function mdATiptap(md: string): JSONContent {
  const content: JSONContent[] = [];
  let lista: JSONContent | null = null;

  for (const cruda of md.trim().split("\n")) {
    const linea = cruda.trim();
    const item = linea.match(/^(-|\d+\.)\s+(.*)$/);
    if (item) {
      const tipo = item[1] === "-" ? "bulletList" : "orderedList";
      if (!lista || lista.type !== tipo) {
        lista = { type: tipo, content: [] };
        content.push(lista);
      }
      lista.content!.push({ type: "listItem", content: [parrafo(item[2])] });
      continue;
    }
    lista = null;
    if (!linea) continue;
    const titulo = linea.match(/^(#{1,3})\s+(.*)$/);
    if (titulo) content.push({ type: "heading", attrs: { level: titulo[1].length }, content: marcas(titulo[2]) });
    else if (linea === "---") content.push({ type: "horizontalRule" });
    else content.push(parrafo(linea));
  }

  return { type: "doc", content };
}
