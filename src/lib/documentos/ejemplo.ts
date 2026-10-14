import type { ContextoDocumento } from "./datos";
import { ESTUDIO_BASE, membreteDe, valoresEstudio } from "./estudio";
import { HONORARIOS_BASE } from "@/lib/honorarios/calculo";

const ESTUDIO_EJEMPLO = {
  ...ESTUDIO_BASE,
  firmantes: ESTUDIO_BASE.firmantes.map((f) => ({ ...f, dni: "12345678" })),
};

// Obra ficticia para la vista previa de las plantillas.
export const CONTEXTO_EJEMPLO: ContextoDocumento = {
  valores: {
    "obra.titulo": "Casa de ejemplo",
    "obra.tipologia": "Vivienda unifamiliar",
    "obra.estado": "En proyecto",
    "obra.ubicacion": "Av. Siempre Viva 742, Tigre, Buenos Aires",
    "obra.direccion": "Av. Siempre Viva 742",
    "obra.localidad": "Tigre",
    "obra.provincia": "Buenos Aires",
    "obra.superficie_total": "220 m²",
    "obra.superficie_cubierta": "180 m²",
    "obra.superficie_semicubierta": "40 m²",
    "obra.superficie_descubierta": "0 m²",
    "obra.servicios": "Anteproyecto, proyecto ejecutivo y dirección de obra",
    "obra.proyecto_inicio": "1 de marzo de 2027",
    "obra.proyecto_duracion": "4 meses",
    "obra.obra_inicio": "1 de agosto de 2027",
    "obra.obra_duracion": "12 meses",
    "obra.inicio": "1 de marzo de 2027",
    "obra.fin": "26 de marzo de 2028",
    "obra.inicio_en": "March 1, 2027",
    "obra.fin_en": "March 26, 2028",
    "cliente.nombre": "Familia Ejemplo",
    "cliente.dni_cuit": "20-12345678-9",
    "cliente.domicilio": "Calle Falsa 123, CABA",
    "cliente.email": "cliente@ejemplo.com",
    "cliente.telefono": "+54 11 1234-5678",
    ...valoresEstudio(ESTUDIO_EJEMPLO),
    "fecha.hoy": "14 de octubre de 2026",
  },
  servicios: ["Anteproyecto", "Proyecto ejecutivo", "Dirección de obra"],
  especialidades: [
    { especialidad: "Estructura", responsable: "Ing. Ejemplo" },
    { especialidad: "Instalación eléctrica", responsable: null },
  ],
  superficies: { cubierta: 180, semicubierta: 40, descubierta: 0, total: 220, sectores: [] },
  cronogramas: {
    proyecto: [
      { nombre: "Anteproyecto", inicio: "2027-03-01", fin: "2027-03-28", clave: false, detalle: "Relevamiento y análisis del terreno\nCroquis preliminares y renders de estudio" },
      { nombre: "Proyecto", inicio: "2027-03-29", fin: "2027-04-25", clave: true, detalle: "Planos arquitectónicos completos\nDocumentación lista para gestión municipal" },
    ],
    obra: [
      { nombre: "Obra húmeda", inicio: "2027-05-03", fin: "2027-11-28", clave: true, detalle: "Movimiento de suelos\nFundaciones\nEstructura de hormigón y mampostería" },
      { nombre: "Terminaciones", inicio: "2027-11-29", fin: "2028-03-26", clave: true, detalle: "Revoques finos\nPintura\nPisos y revestimientos" },
    ],
  },
  firmantesEstudio: ESTUDIO_EJEMPLO.firmantes,
  membrete: membreteDe(ESTUDIO_EJEMPLO),
  honorarios: { config: HONORARIOS_BASE, categoria: "vivienda", m2: 250 },
};

export const DATOS_EJEMPLO: Record<string, unknown> = {
  moneda: "ARS",
  honorarios_estimados: "4500000",
  honorarios: "4500000",
  monto: "1200000",
  forma_pago: "40% a la firma, 30% al aprobar el anteproyecto y 30% contra entrega del proyecto ejecutivo.",
  sector: "Sector Acceso",
  idioma: "bilingue",
  jurisdiccion: "argentina_caba",
  caratula: false,
  hitos: [
    { porcentaje: "20", descripcion: "Firma", descripcion_en: "Signing" },
    { porcentaje: "40", descripcion: "Entrega de documentación", descripcion_en: "Documentation delivery" },
    { porcentaje: "40", descripcion: "Final de obra", descripcion_en: "Construction completion" },
  ],
  lugar: "Ciudad Autónoma de Buenos Aires",
  fecha: "2026-10-14",
  destinatario: "Comisión de Arquitectura Barrio Ejemplo",
  referencia: "Manzana I - Lote 004",
  estudio_presentante: "Noreste Arquitectura",
  proyectista: "Arq. Juan Esperon — Matrícula profesional 0000",
  director_obra: "Arq. Josefina Gardey — Matrícula profesional 0000",
  validez_dias: "30",
  objeto: "Descripción del objeto del contrato.",
  plazo: "6 meses",
  lugar_firma: "Ciudad Autónoma de Buenos Aires",
  fecha_firma: "2026-10-14",
  contraparte_nombre: "Constructora Ejemplo S.A.",
  contraparte_dni: "30-71234567-8",
  contraparte_domicilio: "Av. Ejemplo 1000, CABA",
  indice_cac: "15.432,1",
  fecha_cac: "septiembre 2026",
  items: [
    { seccion: "Honorarios del estudio", concepto: "Anteproyecto y proyecto ejecutivo", monto: "3000000" },
    { seccion: "Honorarios del estudio", concepto: "Dirección de obra", monto: "1500000" },
    { seccion: "Costo estimado de obra", concepto: "Obra completa (220 m²)", monto: "180000000" },
    { seccion: "Consultores y especialistas", concepto: "Cálculo estructural", monto: "900000" },
  ],
};
