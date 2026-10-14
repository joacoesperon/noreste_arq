// Checklist de entrega aportado por el estudio (Noreste_Modificaciones_Web_v1.pdf, anexo de la pregunta 18).
// Obligatorio solo para tareas de entrega de documentación.
// Los ids se guardan en `tareas.checklist`: no cambiarlos aunque cambie el texto.
// Los dos últimos ítems de la sección 8 del PDF (avisar al revisor y pasar a «En revisión»;
// tildar «Completado» solo después de la aprobación) los resuelve el flujo del panel.

export type ItemChecklist = { id: string; texto: string };
export type SeccionChecklist = { titulo: string; items: ItemChecklist[] };

export const CHECKLIST_ENTREGA: SeccionChecklist[] = [
  {
    titulo: "1. Alcance y consigna",
    items: [
      { id: "1.1", texto: "Releí la consigna original de la tarea (no mi recuerdo de ella) y lo entregado cubre todo lo pedido." },
      { id: "1.2", texto: "Incorporé todos los comentarios, mails y WhatsApps posteriores que modificaron el pedido original." },
      { id: "1.3", texto: "No quedan ítems «para después» sin registrar: si algo quedó afuera, está creado como tarea nueva o consultado con el responsable." },
    ],
  },
  {
    titulo: "2. Modelo / archivo de trabajo",
    items: [
      { id: "2.1", texto: "El archivo está en la carpeta correcta del proyecto, con la nomenclatura del estudio y la versión/revisión actualizada." },
      { id: "2.2", texto: "Purgué elementos no usados, capas/familias/vínculos huérfanos y warnings críticos (Revit: revisé el panel de advertencias; CAD: purge y audit)." },
      { id: "2.3", texto: "Los vínculos (xrefs, modelos vinculados, topografía, estructura, instalaciones) están cargados desde la ruta del servidor, no desde la máquina local." },
      { id: "2.4", texto: "Hice sincronización con el central / guardé copia de seguridad." },
    ],
  },
  {
    titulo: "3. Coherencia técnica",
    items: [
      { id: "3.1", texto: "Cotas, niveles y escalas verificados contra el relevamiento y el último plano aprobado." },
      { id: "3.2", texto: "Superficies y cómputos de locales coinciden con el cuadro de áreas y con lo que exige el código de edificación (FOT, FOS, retiros, alturas)." },
      { id: "3.3", texto: "Cortes, vistas y plantas son coherentes entre sí: lo que se ve en planta se ve igual en corte y fachada." },
      { id: "3.4", texto: "Aberturas, carpinterías y locales están numerados y coinciden con las planillas." },
      { id: "3.5", texto: "Revisé interferencias con estructura e instalaciones y no hay conflictos pendientes con los especialistas." },
    ],
  },
  {
    titulo: "4. Documentación gráfica",
    items: [
      { id: "4.1", texto: "Rótulo completo: proyecto, comitente, fecha, escala, número de plano, revisión, profesional y firmas donde corresponda." },
      { id: "4.2", texto: "Cuadros de referencia, símbolos, norte y escala gráfica presentes y correctos." },
      { id: "4.3", texto: "Estilos de línea, espesores, textos y cotas respetan el estándar gráfico del estudio." },
      { id: "4.4", texto: "Planillas (locales, aberturas, terminaciones) actualizadas, sin campos vacíos." },
      { id: "4.5", texto: "Textos revisados: ortografía, unidades y consistencia de nomenclatura entre planos." },
    ],
  },
  {
    titulo: "5. Control cruzado",
    items: [
      { id: "5.1", texto: "Verifiqué que lo entregado responde a la última decisión del cliente y del director de proyecto, no a una versión anterior." },
      { id: "5.2", texto: "Comparé contra la revisión previa y listé qué cambió; ese listado acompaña la entrega." },
      { id: "5.3", texto: "Si la tarea tiene destino municipal, comprobé requisitos de presentación vigentes (formatos, carátulas, planillas obligatorias, firmas de profesionales)." },
    ],
  },
  {
    titulo: "6. Salida y entrega",
    items: [
      { id: "6.1", texto: "Exporté PDF/DWG/IFC según corresponda, con la configuración de plotteo correcta, y abrí el archivo exportado para verificar que sale bien (no solo el original)." },
      { id: "6.2", texto: "Los archivos exportados están en la carpeta de entregas con nombre y revisión correctos." },
      { id: "6.3", texto: "Los archivos obsoletos fueron movidos a «históricos»/«superados» para que nadie trabaje sobre una versión vieja." },
    ],
  },
  {
    titulo: "7. Autoverificación final",
    items: [
      { id: "7.1", texto: "Imprimí o revisé el plano en pantalla completa como lo vería quien lo recibe, no como lo veo mientras dibujo." },
      { id: "7.2", texto: "Me pregunté: si mañana alguien construye o presenta esto sin consultarme, ¿hay algo que lo haga fallar?" },
      { id: "7.3", texto: "Tengo evidencia de la finalización (archivo, captura o link) para adjuntar en la tarea." },
    ],
  },
  {
    titulo: "8. Registro en el planificador",
    items: [
      { id: "8.1", texto: "Adjunté el link/archivo final y un comentario breve con lo hecho, lo que quedó pendiente y las dudas abiertas." },
      { id: "8.2", texto: "Registré las horas reales dedicadas." },
    ],
  },
];

export const REGLA_DE_ORO =
  "Una tarea no está terminada cuando yo dejé de trabajar en ella, sino cuando otra persona puede usarla sin tener que preguntarme nada.";

export const ITEMS_CHECKLIST = CHECKLIST_ENTREGA.flatMap((s) => s.items);

export function checklistCompleto(respuestas: unknown) {
  const r = (respuestas ?? {}) as Record<string, unknown>;
  return ITEMS_CHECKLIST.every((i) => r[i.id] === true);
}

export function checklistProgreso(respuestas: unknown) {
  const r = (respuestas ?? {}) as Record<string, unknown>;
  return { hechos: ITEMS_CHECKLIST.filter((i) => r[i.id] === true).length, total: ITEMS_CHECKLIST.length };
}
