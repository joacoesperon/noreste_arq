// Formulario «Cotizá tu proyecto» de la home: preguntas para calificar la consulta y el
// mensaje de WhatsApp que se arma con las respuestas.

export type Respuestas = {
  tipo: string;
  ubicacion: string;
  servicio: string;
  presupuesto: string;
  etapa: string;
  plazo: string;
  nombre: string;
};

export type Pregunta = {
  campo: keyof Respuestas;
  titulo: string;
  /** Rótulo en el mensaje de WhatsApp y en el panel */
  rotulo: string;
  /** Sin opciones = respuesta libre */
  opciones?: readonly string[];
  /** Opción que pide completar a mano (p. ej. «Otro proyecto») */
  otra?: string;
  placeholder?: string;
};

export const OTRO_PROYECTO = "Otro proyecto";

export const PREGUNTAS: readonly Pregunta[] = [
  {
    campo: "tipo",
    titulo: "¿Qué tipo de proyecto tenés en mente?",
    rotulo: "Tipo de proyecto",
    opciones: [
      "Vivienda",
      "Reforma / Ampliación",
      "Caballeriza / Proyecto rural",
      "Local comercial / Espacio de trabajo",
      "Masterplan / Desarrollo inmobiliario",
      OTRO_PROYECTO,
    ],
    otra: OTRO_PROYECTO,
  },
  {
    campo: "ubicacion",
    titulo: "¿Dónde se encuentra el proyecto?",
    rotulo: "Ubicación",
    placeholder: "Localidad, barrio o zona",
  },
  {
    campo: "servicio",
    titulo: "¿Qué servicio estás buscando?",
    rotulo: "Servicio",
    opciones: [
      "Anteproyecto / Diseño",
      "Proyecto ejecutivo / Documentación",
      "Dirección de obra",
      "Proyecto, dirección y ejecución",
      "No lo tengo definido todavía",
    ],
  },
  {
    campo: "presupuesto",
    titulo: "¿Qué presupuesto estimás destinar?",
    rotulo: "Presupuesto estimado",
    placeholder: "Un monto aproximado",
  },
  {
    campo: "etapa",
    titulo: "¿En qué etapa estás?",
    rotulo: "Etapa actual",
    opciones: [
      "Ya tengo terreno o propiedad",
      "Necesito proyecto y presupuesto",
      "Tengo proyecto y quiero construir",
      "Quiero reformar algo existente",
    ],
  },
  {
    campo: "plazo",
    titulo: "¿Cuándo te gustaría avanzar?",
    rotulo: "Plazo",
    opciones: ["Lo antes posible", "En los próximos 6 meses", "A mediano plazo", "Estoy explorando posibilidades"],
  },
];

export const A_DEFINIR = "A definir";

export function mensajeWhatsapp(r: Respuestas) {
  const lineas = PREGUNTAS.map((p) => `${p.rotulo}: ${r[p.campo].trim() || A_DEFINIR}`);
  const saludo = r.nombre.trim()
    ? `Hola, Noreste Arquitectura. Soy ${r.nombre.trim()} y quisiera consultar por mi proyecto.`
    : "Hola, Noreste Arquitectura. Quisiera consultar por mi proyecto.";
  return [saludo, "", ...lineas, "", "¿Podemos coordinar una primera charla?"].join("\n");
}

/** Link de WhatsApp (wa.me) con el mensaje armado. */
export function linkWhatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}
