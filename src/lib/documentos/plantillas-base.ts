import type { JSONContent } from "@tiptap/core";
import { mdATiptap } from "./markdown";
import { TIPOS_DOCUMENTO, type Firmante } from "./tipos";

// PLANTILLAS BASE PROVISORIAS. Se usan hasta que el estudio guarde las suyas desde
// «Plantillas» (con los textos de sus modelos de propuesta, presupuesto y contratos).
// Los contratos NO incluyen cláusulas: el texto legal lo aporta el estudio o su abogado.

const ENCABEZADO = `
**{{obra.titulo}}** · {{obra.ubicacion}}
{{fecha.hoy}}
`;

const AVISO = "*[Texto provisorio: reemplazar por el del modelo del estudio desde Plantillas.]*";

const PROPUESTA = `
# Propuesta de servicios profesionales
${ENCABEZADO}
## Para
{{cliente.nombre}}

## La obra
{{obra.tipologia}} de {{obra.superficie_total}} en {{obra.ubicacion}}.

{{bloque.superficies}}

## Servicios incluidos
{{bloque.servicios}}

## Etapas y plazos
Proyecto: inicio estimado el {{obra.proyecto_inicio}}, con una duración de {{obra.proyecto_duracion}}.

Obra: inicio estimado el {{obra.obra_inicio}}, con una duración de {{obra.obra_duracion}}.

## Honorarios
Honorarios estimados: **{{doc.honorarios_estimados}}**.

Forma de pago: {{doc.forma_pago}}

## Condiciones
${AVISO}

Esta propuesta tiene una validez de {{doc.validez_dias}} días desde su fecha.

---
{{estudio.profesionales}}
{{estudio.nombre}}
`;

const PRESUPUESTO = `
# Presupuesto
${ENCABEZADO}
Cliente: {{cliente.nombre}}

{{bloque.presupuesto}}

## Actualización de valores
Los montos se actualizan según el índice del costo de la construcción de la Cámara Argentina de la Construcción (CAC). Índice de referencia: {{doc.indice_cac}} ({{doc.fecha_cac}}).

## Notas
{{doc.notas}}

Validez del presupuesto: {{doc.validez_dias}} días.
`;

const CLAUSULAS = `
## Cláusulas
*[Pegar acá las cláusulas del modelo de contrato revisado por el abogado del estudio, desde Plantillas. El panel completa los datos y da formato, pero no redacta cláusulas.]*
`;

const CONTRATO_PROYECTO = `
# Contrato de locación de obra intelectual
## Proyecto y dirección de obra

## Partes
**Comitente:** {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, con domicilio en {{cliente.domicilio}}.

**Estudio:** {{estudio.nombre}}, representado por {{estudio.profesionales}}.

## Obra
{{obra.titulo}}: {{obra.tipologia}} de {{obra.superficie_total}}, ubicada en {{obra.ubicacion}}.

## Servicios
{{bloque.servicios}}

## Honorarios
{{doc.honorarios}}. Forma de pago: {{doc.forma_pago}}
${CLAUSULAS}
En {{doc.lugar_firma}}, el {{doc.fecha_firma}}.

{{bloque.firmas}}
`;

function parte(f: Firmante) {
  if (f === "cliente") return "**Comitente:** {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, con domicilio en {{cliente.domicilio}}.";
  if (f === "estudio") return "**Estudio:** {{estudio.nombre}}, representado por {{estudio.profesionales}}.";
  return "**Contraparte:** {{doc.contraparte_nombre}}, DNI/CUIT {{doc.contraparte_dni}}, con domicilio en {{doc.contraparte_domicilio}}.";
}

function contrato(nombre: string, firmantes: [Firmante, Firmante]) {
  return `
# ${nombre}

## Partes
${parte(firmantes[0])}

${parte(firmantes[1])}

## Obra
{{obra.titulo}}, ubicada en {{obra.ubicacion}}.

## Objeto
{{doc.objeto}}

## Monto y forma de pago
{{doc.monto}}. Forma de pago: {{doc.forma_pago}}

## Plazo
{{doc.plazo}}
${CLAUSULAS}
En {{doc.lugar_firma}}, el {{doc.fecha_firma}}.

{{bloque.firmas}}
`;
}

const cronograma = (tipo: "proyecto" | "obra") => `
# Cronograma de ${tipo}
${ENCABEZADO}
{{bloque.cronograma_${tipo}}}

• Fecha clave. Las fechas son estimadas y se ajustan según el avance del ${tipo}.

{{doc.notas}}
`;

function markdownBase(clave: string): string {
  switch (clave) {
    case "propuesta":
      return PROPUESTA;
    case "presupuesto":
      return PRESUPUESTO;
    case "contrato_proyecto":
      return CONTRATO_PROYECTO;
    case "cronograma_proyecto":
      return cronograma("proyecto");
    case "cronograma_obra":
      return cronograma("obra");
    default: {
      const tipo = TIPOS_DOCUMENTO.find((t) => t.clave === clave);
      return tipo ? contrato(tipo.nombre, tipo.firmantes ?? ["cliente", "estudio"]) : "# Documento";
    }
  }
}

export function plantillaBase(clave: string): JSONContent {
  return mdATiptap(markdownBase(clave));
}
