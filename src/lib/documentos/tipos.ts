// Tipos de documento (alcance módulo 02 y pregunta 9) y los campos propios de cada uno.
// Los datos de la obra, el cliente y el estudio se completan solos; estos campos
// son los que se cargan en cada documento (montos, contraparte, fechas de firma…).

export type TipoCampo =
  | "texto"
  | "textoLargo"
  | "monto"
  | "moneda"
  | "fecha"
  | "numero"
  | "items"
  | "hitos"
  | "booleano"
  | "opcion";

export type Campo = {
  key: string;
  label: string;
  tipo: TipoCampo;
  /** Para tipo "opcion" */
  opciones?: { value: string; label: string }[];
  /** Si está vacío no se marca como faltante. */
  opcional?: boolean;
  ayuda?: string;
};

export type ItemPresupuesto = { seccion: string; concepto: string; monto: string };

/** Hito de pago: porcentaje de los honorarios y en qué momento (pregunta 7 y contrato NE26). */
export type ItemHito = { porcentaje: string; descripcion: string; descripcion_en: string };

export const HITOS_NE26: ItemHito[] = [
  { porcentaje: "20", descripcion: "Firma", descripcion_en: "Signing" },
  { porcentaje: "20", descripcion: "Entrega de documentación", descripcion_en: "Documentation delivery" },
  { porcentaje: "20", descripcion: "Mitad de obra", descripcion_en: "Mid-construction" },
  {
    porcentaje: "40",
    descripcion: "Posterior al final de obra, una vez transcurridos 2 (dos) meses dentro del período de garantía",
    descripcion_en: "After construction completion, once 2 (two) months have elapsed within the warranty period",
  },
];

/** Ley aplicable y tribunales del contrato, en español e inglés. */
export const JURISDICCIONES = {
  argentina_caba: {
    label: "Argentina (Ciudad de Buenos Aires)",
    ley: "la República Argentina",
    ley_en: "the Argentine Republic",
    tribunales: "los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires",
    tribunales_en: "the ordinary courts of the Autonomous City of Buenos Aires",
  },
  argentina_pba: {
    label: "Argentina (Provincia de Buenos Aires)",
    ley: "la República Argentina",
    ley_en: "the Argentine Republic",
    tribunales: "los tribunales ordinarios de la Provincia de Buenos Aires",
    tribunales_en: "the ordinary courts of the Province of Buenos Aires",
  },
  uruguay_maldonado: {
    label: "Uruguay (Maldonado)",
    ley: "la República Oriental del Uruguay",
    ley_en: "the Oriental Republic of Uruguay",
    tribunales: "los tribunales del Departamento de Maldonado, Uruguay",
    tribunales_en: "the courts of the Department of Maldonado, Uruguay",
  },
} as const;

export type Jurisdiccion = keyof typeof JURISDICCIONES;

const campoCaratula = (porDefecto: boolean): Campo => ({
  key: "caratula",
  label: "Carátula y contratapa (solo PDF)",
  tipo: "booleano",
  ayuda: porDefecto ? undefined : "Páginas negras con el isotipo, como en las presentaciones del estudio.",
});

export const SECCIONES_PRESUPUESTO = [
  "Honorarios del estudio",
  "Costo estimado de obra",
  "Consultores y especialistas",
] as const;

/** Quién firma: el comitente (cliente de la obra), el estudio o la contraparte del documento. */
export type Firmante = "cliente" | "estudio" | "contraparte";

export type TipoDocumento = {
  clave: string;
  nombre: string;
  grupo: "Propuestas y presupuestos" | "Contratos" | "Cronogramas" | "Notas";
  campos: Campo[];
  firmantes?: [Firmante, Firmante];
  /** Valores iniciales de los campos al crear el documento. */
  inicial?: Record<string, unknown>;
};

const LUGAR = "Ciudad Autónoma de Buenos Aires";

const camposFirma: Campo[] = [
  { key: "lugar_firma", label: "Lugar de firma", tipo: "texto" },
  { key: "fecha_firma", label: "Fecha de firma", tipo: "fecha" },
];

const camposContraparte: Campo[] = [
  { key: "contraparte_nombre", label: "Contraparte: nombre o razón social", tipo: "texto" },
  { key: "contraparte_dni", label: "Contraparte: DNI / CUIT", tipo: "texto" },
  { key: "contraparte_domicilio", label: "Contraparte: domicilio", tipo: "texto" },
];

const camposContrato: Campo[] = [
  { key: "objeto", label: "Objeto", tipo: "textoLargo" },
  { key: "monto", label: "Monto", tipo: "monto" },
  { key: "moneda", label: "Moneda", tipo: "moneda" },
  { key: "forma_pago", label: "Forma de pago", tipo: "textoLargo" },
  { key: "plazo", label: "Plazo", tipo: "texto" },
  ...camposFirma,
];

function contrato(clave: string, nombre: string, firmantes: [Firmante, Firmante], contraparte: boolean): TipoDocumento {
  return {
    clave,
    nombre,
    grupo: "Contratos",
    campos: [...(contraparte ? camposContraparte : []), ...camposContrato],
    firmantes,
    inicial: { moneda: "ARS", lugar_firma: LUGAR },
  };
}

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  {
    clave: "propuesta",
    nombre: "Propuesta de servicios",
    grupo: "Propuestas y presupuestos",
    campos: [
      { key: "sector", label: "Sector o referencia", tipo: "texto", opcional: true, ayuda: "Ej.: Sector Acceso. Va en el título." },
      { key: "honorarios_estimados", label: "Honorarios estimados", tipo: "monto" },
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      { key: "hitos", label: "Forma de pago por hitos", tipo: "hitos" },
      { key: "validez_dias", label: "Validez (días)", tipo: "numero" },
      campoCaratula(true),
    ],
    inicial: { moneda: "USD", validez_dias: "30", hitos: HITOS_NE26, caratula: true },
  },
  {
    clave: "presupuesto",
    nombre: "Presupuesto",
    grupo: "Propuestas y presupuestos",
    campos: [
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      {
        key: "items",
        label: "Ítems",
        tipo: "items",
        ayuda: "Honorarios del estudio, costo estimado de obra y presupuestos de consultores o especialistas.",
      },
      { key: "indice_cac", label: "Índice CAC de referencia", tipo: "texto", opcional: true },
      { key: "fecha_cac", label: "Mes del índice CAC", tipo: "texto", opcional: true, ayuda: "Ej.: septiembre 2026" },
      { key: "validez_dias", label: "Validez (días)", tipo: "numero" },
      { key: "notas", label: "Notas", tipo: "textoLargo", opcional: true },
      campoCaratula(false),
    ],
    inicial: { moneda: "ARS", validez_dias: "30", items: [] },
  },
  {
    clave: "contrato_proyecto",
    nombre: "Contrato de proyecto y dirección de obra",
    grupo: "Contratos",
    campos: [
      {
        key: "idioma",
        label: "Idioma",
        tipo: "opcion",
        opciones: [
          { value: "bilingue", label: "Bilingüe (español | inglés)" },
          { value: "es", label: "Solo español" },
        ],
      },
      { key: "honorarios", label: "Honorarios", tipo: "monto" },
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      { key: "hitos", label: "Forma de pago por hitos", tipo: "hitos" },
      {
        key: "jurisdiccion",
        label: "Ley y tribunales",
        tipo: "opcion",
        opciones: Object.entries(JURISDICCIONES).map(([value, j]) => ({ value, label: j.label })),
      },
      ...camposFirma,
    ],
    firmantes: ["cliente", "estudio"],
    inicial: { idioma: "bilingue", moneda: "USD", hitos: HITOS_NE26, jurisdiccion: "argentina_caba", lugar_firma: LUGAR },
  },
  {
    // Modelo de contrato del CPAU (Consejo Profesional de Arquitectura y Urbanismo) para obras en Argentina.
    clave: "contrato_cpau",
    nombre: "Contrato de proyecto y dirección de obra (Argentina, modelo CPAU)",
    grupo: "Contratos",
    campos: [
      { key: "grupo_cpau", label: "Grupo de la obra (CPAU)", tipo: "texto", ayuda: "Según el documento CPAU A-115. Ej.: 2" },
      { key: "monto_obra", label: "Monto tentativo de obra, con IVA", tipo: "monto" },
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      { key: "plazo_obra", label: "Plazo de construcción (días hábiles)", tipo: "numero" },
      {
        key: "modalidad",
        label: "Modalidad de contratación de la obra",
        tipo: "opcion",
        opciones: [
          { value: "Dirección por administración", label: "Dirección por administración" },
          { value: "Contrato por ajuste alzado", label: "Contrato por ajuste alzado" },
          { value: "Contrato por unidad de medida", label: "Contrato por unidad de medida" },
          { value: "Contrato por coste y costas", label: "Contrato por coste y costas" },
        ],
      },
      { key: "tareas", label: "Tareas incluidas (2.3)", tipo: "textoLargo", ayuda: "Lo que comprende el servicio, además de arquitectura, estructuras e instalaciones." },
      { key: "servicios_adicionales", label: "Servicios adicionales (2.5)", tipo: "textoLargo" },
      { key: "honorarios", label: "Honorarios de proyecto y dirección (3.1)", tipo: "monto" },
      { key: "monto_adicionales", label: "Honorarios de los servicios adicionales (3.2)", tipo: "texto" },
      { key: "tarifa_hora", label: "Tarifa por hora (3.4)", tipo: "monto" },
      { key: "hitos", label: "Facturación de los honorarios (3.5)", tipo: "hitos" },
      { key: "autoridad", label: "Quién otorga el permiso de obra", tipo: "texto", ayuda: "Ej.: el GCABA, la Municipalidad de Pilar" },
      { key: "otros_acuerdos", label: "Otros acuerdos (cláusula 10)", tipo: "textoLargo" },
      ...camposFirma,
    ],
    firmantes: ["estudio", "cliente"],
    inicial: {
      moneda: "ARS",
      modalidad: "Dirección por administración",
      tareas: "programa de necesidades, documentación de proyecto, cómputo y presupuesto, y dirección de obra",
      servicios_adicionales: "no se prevén",
      monto_adicionales: "no corresponde",
      hitos: HITOS_NE26,
      autoridad: "el GCABA",
      otros_acuerdos: "No hay otros acuerdos.",
      lugar_firma: LUGAR,
    },
  },
  contrato("contrato_administracion", "Contrato de administración de obra", ["cliente", "estudio"], false),
  contrato("contrato_construccion", "Contrato de construcción", ["cliente", "contraparte"], true),
  contrato("contrato_subcontrato", "Subcontrato con consultor o especialista", ["estudio", "contraparte"], true),
  contrato(
    "contrato_obra_intelectual",
    "Contrato de obra intelectual y reproducción en medios",
    ["estudio", "contraparte"],
    true
  ),
  contrato("contrato_asesoramiento", "Contrato de asesoramiento", ["cliente", "estudio"], false),
  contrato("contrato_interiorismo", "Contrato de interiorismo", ["cliente", "estudio"], false),
  contrato("contrato_paisajismo", "Contrato de paisajismo", ["cliente", "estudio"], false),
  {
    clave: "cronograma_proyecto",
    nombre: "Cronograma de proyecto",
    grupo: "Cronogramas",
    campos: [{ key: "notas", label: "Notas", tipo: "textoLargo", opcional: true }, campoCaratula(false)],
  },
  {
    clave: "cronograma_obra",
    nombre: "Cronograma de obra",
    grupo: "Cronogramas",
    campos: [{ key: "notas", label: "Notas", tipo: "textoLargo", opcional: true }, campoCaratula(false)],
  },
  {
    clave: "nota_presentacion",
    nombre: "Nota de presentación de proyecto",
    grupo: "Notas",
    campos: [
      { key: "lugar", label: "Lugar", tipo: "texto" },
      { key: "fecha", label: "Fecha", tipo: "fecha" },
      { key: "destinatario", label: "Destinatario", tipo: "texto", ayuda: "Ej.: Comisión de Arquitectura Barrio El Nido" },
      { key: "referencia", label: "Lote o referencia", tipo: "texto", ayuda: "Ej.: Manzana I - Lote 004" },
      { key: "apoderado", label: "Apoderado (si firma en nombre del propietario)", tipo: "texto", opcional: true },
      { key: "estudio_presentante", label: "Estudio o profesional que presenta la documentación", tipo: "texto" },
      { key: "proyectista", label: "Arquitecto proyectista (nombre y matrícula)", tipo: "textoLargo" },
      { key: "director_obra", label: "Director de obra (nombre y matrícula)", tipo: "textoLargo" },
    ],
    inicial: { lugar: "Ciudad Autónoma de Buenos Aires" },
  },
];

export function tipoDocumento(clave: string): TipoDocumento | undefined {
  return TIPOS_DOCUMENTO.find((t) => t.clave === clave);
}
