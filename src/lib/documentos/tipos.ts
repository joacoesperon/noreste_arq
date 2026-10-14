// Tipos de documento (alcance módulo 02 y pregunta 9) y los campos propios de cada uno.
// Los datos de la obra, el cliente y el estudio se completan solos; estos campos
// son los que se cargan en cada documento (montos, contraparte, fechas de firma…).

export type TipoCampo = "texto" | "textoLargo" | "monto" | "moneda" | "fecha" | "numero" | "items";

export type Campo = {
  key: string;
  label: string;
  tipo: TipoCampo;
  /** Si está vacío no se marca como faltante. */
  opcional?: boolean;
  ayuda?: string;
};

export type ItemPresupuesto = { seccion: string; concepto: string; monto: string };

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
  grupo: "Propuestas y presupuestos" | "Contratos" | "Cronogramas";
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
      { key: "honorarios_estimados", label: "Honorarios estimados", tipo: "monto" },
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      { key: "forma_pago", label: "Forma de pago", tipo: "textoLargo" },
      { key: "validez_dias", label: "Validez (días)", tipo: "numero" },
    ],
    inicial: { moneda: "ARS", validez_dias: "30" },
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
    ],
    inicial: { moneda: "ARS", validez_dias: "30", items: [] },
  },
  {
    clave: "contrato_proyecto",
    nombre: "Contrato de proyecto y dirección de obra",
    grupo: "Contratos",
    campos: [
      { key: "honorarios", label: "Honorarios", tipo: "monto" },
      { key: "moneda", label: "Moneda", tipo: "moneda" },
      { key: "forma_pago", label: "Forma de pago", tipo: "textoLargo" },
      ...camposFirma,
    ],
    firmantes: ["cliente", "estudio"],
    inicial: { moneda: "ARS", lugar_firma: LUGAR },
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
    campos: [{ key: "notas", label: "Notas", tipo: "textoLargo", opcional: true }],
  },
  {
    clave: "cronograma_obra",
    nombre: "Cronograma de obra",
    grupo: "Cronogramas",
    campos: [{ key: "notas", label: "Notas", tipo: "textoLargo", opcional: true }],
  },
];

export function tipoDocumento(clave: string): TipoDocumento | undefined {
  return TIPOS_DOCUMENTO.find((t) => t.clave === clave);
}
