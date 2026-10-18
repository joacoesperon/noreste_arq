import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { RUBROS, UNIDADES } from "./constants";

// Lectura de listas de precios con IA (Claude). Las listas de corralones vienen en cualquier
// formato: varios precios en una celda («suelta 39000 Bolsón $42000»), títulos de sección,
// encabezados que no son encabezados. Claude separa cada producto y presentación con su precio
// y propone con qué material del catálogo se corresponde, aunque cada proveedor lo nombre distinto.
// Lo propuesto se revisa en pantalla antes de importar.

const MODELO = "claude-opus-5-5";
/** Filas por llamada: listas largas se leen en partes (en paralelo). */
const FILAS_POR_PARTE = 200;

export type MaterialCatalogo = { id: string; nombre: string; unidad: string; codigo: string | null; rubro: string };

const itemSchema = z.object({
  fila: z.number().int().describe("Número de fila de la lista (el que va después de F)"),
  descripcion: z.string().describe("Descripción del producto copiada tal cual figura en la lista, sin la presentación"),
  presentacion: z
    .string()
    .nullable()
    .describe("Presentación o variante copiada tal cual figura (p. ej. «suelta», «Bolsón», «x 25 kg»); null si hay un solo precio"),
  precio: z.number().describe("Precio tal cual figura en la lista, como número (formato argentino: 1.750 = mil setecientos cincuenta)"),
  unidad: z.enum(UNIDADES).describe("Unidad de venta del precio"),
  rubro: z.enum(RUBROS),
  material_ref: z
    .string()
    .nullable()
    .describe("Referencia (M…) del material del catálogo que es el mismo producto y la misma unidad; null si no hay ninguno"),
  confianza: z.enum(["alta", "media", "baja"]).describe("Qué tan seguro es el material_ref"),
  nombre_catalogo: z
    .string()
    .describe("Nombre genérico y prolijo para el catálogo si hubiera que crearlo, sin marca comercial salvo que importe (p. ej. «Arena gruesa a granel»)"),
});

const respuestaSchema = z.object({ items: z.array(itemSchema) });

export type ItemIA = {
  fila: number;
  /** Texto con el que se guarda la equivalencia del proveedor: descripción + presentación. */
  texto: string;
  precio: number;
  unidad: string;
  rubro: string;
  material_id: string | null;
  confianza: "alta" | "media" | "baja";
  nombre_catalogo: string;
};

const INSTRUCCIONES = `Sos asistente de un estudio de arquitectura en Argentina. Te paso la lista de precios de un proveedor de materiales (corralón, casa de sanitarios, etc.) tal como se leyó del archivo: una línea por fila, celdas separadas por « | ». Puede venir desprolija: títulos de sección, encabezados repetidos, varias presentaciones con su precio en la misma celda, precios con o sin «$».

Tu tarea:
1. Devolvé un ítem por cada producto con precio. Si una celda tiene varias presentaciones con su precio (por ejemplo «suelta 39000 Bolsón $42000»), devolvé un ítem por presentación. Ignorá títulos de sección, encabezados y filas sin precio, pero usá los títulos de sección para entender a qué se refiere cada producto y para elegir el rubro.
2. Copiá la descripción y la presentación tal cual figuran (sirven para reconocer el producto el mes que viene); el nombre prolijo va en nombre_catalogo.
3. El precio va tal cual figura: no sumes ni restes IVA. Formato argentino: el punto separa miles y la coma, decimales.
4. Buscá en el catálogo del estudio el material que sea el mismo producto, aunque el proveedor lo nombre distinto (abreviaturas, marca, orden de las palabras). Tiene que coincidir también la unidad o presentación: «arena a granel por m³» no es lo mismo que «arena en bolsón». Si dudás entre dos, elegí el más probable con confianza «media» o «baja». Si no hay ninguno, material_ref = null.`;

function catalogoTexto(catalogo: MaterialCatalogo[]) {
  if (catalogo.length === 0) return "Catálogo del estudio: (vacío todavía)";
  return [
    "Catálogo del estudio (referencia | nombre | unidad | código | rubro):",
    ...catalogo.map((m, i) => `M${i + 1} | ${m.nombre} | ${m.unidad} | ${m.codigo ?? "—"} | ${m.rubro}`),
  ].join("\n");
}

async function leerParte(client: Anthropic, sistema: string, filas: string[][], desde: number) {
  const lista = filas
    .map((f, i) => `F${desde + i + 1}: ${f.map((c) => c.trim()).join(" | ")}`)
    .filter((l) => !/^F\d+:[\s|]*$/.test(l))
    .join("\n");

  const stream = client.beta.messages.stream({
    model: MODELO,
    max_tokens: 64000,
    // El catálogo y las instrucciones se repiten en cada parte: van en caché.
    system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `Lista del proveedor:\n${lista}` }],
    output_config: { effort: "medium", format: betaZodOutputFormat(respuestaSchema) },
    // Si el modelo declinara la solicitud, la API la reintenta con su modelo de respaldo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  const respuesta = await stream.finalMessage();
  if (respuesta.stop_reason === "refusal") throw new Error("La IA no pudo leer esta lista.");
  if (respuesta.stop_reason === "max_tokens") throw new Error("La lista es demasiado larga para leerla de una vez.");
  if (!respuesta.parsed_output) throw new Error("La IA devolvió una respuesta inválida.");
  return respuesta.parsed_output.items;
}

/** Lee una lista (filas de celdas) y propone ítems con precio y material del catálogo. */
export async function leerListaIA(filas: string[][], catalogo: MaterialCatalogo[]): Promise<ItemIA[]> {
  const client = new Anthropic();
  const sistema = `${INSTRUCCIONES}\n\n${catalogoTexto(catalogo)}`;

  const partes: Promise<z.infer<typeof itemSchema>[]>[] = [];
  for (let i = 0; i < filas.length; i += FILAS_POR_PARTE) {
    partes.push(leerParte(client, sistema, filas.slice(i, i + FILAS_POR_PARTE), i));
  }
  const items = (await Promise.all(partes)).flat();

  return items
    .filter((it) => Number.isFinite(it.precio) && it.precio > 0 && it.descripcion.trim())
    .map((it) => {
      const ref = it.material_ref?.match(/^M(\d+)$/i);
      const material = ref ? catalogo[Number(ref[1]) - 1] : undefined;
      return {
        fila: it.fila,
        texto: [it.descripcion.trim(), it.presentacion?.trim()].filter(Boolean).join(" · "),
        precio: Math.round(it.precio * 100) / 100,
        unidad: it.unidad,
        rubro: it.rubro,
        material_id: material?.id ?? null,
        confianza: it.confianza,
        nombre_catalogo: it.nombre_catalogo.trim() || it.descripcion.trim(),
      };
    })
    .sort((a, b) => a.fila - b.fila);
}
