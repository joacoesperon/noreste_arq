import type { JSONContent } from "@tiptap/core";
import { mdATiptap } from "./markdown";
import { TIPOS_DOCUMENTO, type Firmante } from "./tipos";

// PLANTILLAS BASE. Se usan hasta que el estudio guarde las suyas desde «Plantillas».
// - Contrato de proyecto y dirección de obra: texto del contrato NE26 del estudio (bilingüe,
//   revisado por su abogado), con los datos de cada obra como {{datos}}.
// - Propuesta: estructura de la plantilla NE26 y alcance por etapas del cronograma de Casa Tots.
// - Contrato para obras en Argentina: modelo del CPAU que mandó el estudio.
// - Nota de presentación: modelo de la carta del estudio a una comisión de barrio.
// - Presupuesto y los demás contratos: provisorios (sin modelo del estudio todavía; no se redactan cláusulas).

const AVISO = "*[Texto provisorio: reemplazar por el del modelo del estudio desde Plantillas.]*";

const PROPUESTA = `
# Propuesta de servicio{{doc.sector_guion}}
# {{obra.servicios}}

**{{obra.titulo}}** · {{obra.ubicacion}}
Para: {{cliente.nombre}}

## La obra
{{obra.tipologia}} de {{obra.superficie_total}} en {{obra.ubicacion}}.

{{bloque.superficies}}

## Alcance por etapas
{{bloque.etapas}}

Inicio estimado: {{obra.inicio}}. Finalización estimada: {{obra.fin}}.

## Honorarios
Honorarios: **{{doc.honorarios_estimados}}**.

Forma de pago:

{{bloque.forma_pago}}

## Condiciones
La firma profesional y la presentación municipal quedan a cargo del cliente.

${AVISO}

Esta propuesta tiene una validez de {{doc.validez_dias}} días desde su fecha.
`;

const PRESUPUESTO = `
# Presupuesto

**{{obra.titulo}}** · {{obra.ubicacion}}
Cliente: {{cliente.nombre}} · {{fecha.hoy}}

{{bloque.presupuesto}}

## Actualización de valores
Los montos se actualizan según el índice del costo de la construcción de la Cámara Argentina de la Construcción (CAC). Índice de referencia: {{doc.indice_cac}} ({{doc.fecha_cac}}).

## Notas
{{doc.notas}}

Validez del presupuesto: {{doc.validez_dias}} días.
`;

// Contrato NE26: una fila por párrafo, español || inglés.
const CONTRATO_PROYECTO = `
::: columnas
# CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES || # PROFESSIONAL SERVICES AGREEMENT
**Español** || **English**
**CLÁUSULA 1 - PARTES Y OBJETO** || **CLAUSE 1 - PARTIES AND OBJECT**
1.1 Entre: {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, y {{estudio.nombre}}, {{estudio.firmantes}}. || 1.1 Between: {{cliente.nombre}}, ID {{cliente.dni_cuit}}, and {{estudio.nombre}}, {{estudio.firmantes}}.
1.2 Objeto: Proyecto y Dirección de Obra de {{obra.tipologia}}. || 1.2 Object: Project and Construction Supervision of {{obra.tipologia}}.
1.3 Ubicación: {{obra.ubicacion}}. || 1.3 Location: {{obra.ubicacion}}.
1.4 La superficie estimada es de {{obra.superficie_cubierta}} cubiertos y {{obra.superficie_semicubierta}} semicubiertos. || 1.4 The estimated area is {{obra.superficie_cubierta}} covered and {{obra.superficie_semicubierta}} semi-covered.
**CLÁUSULA 2 - SERVICIOS Y FACULTADES** || **CLAUSE 2 - SERVICES AND POWERS**
2.1 Los servicios comprenden: Proyecto de Arquitectura, Estructuras, Instalaciones, Cómputo y Presupuesto, coordinación aprobación municipal y Supervisión de Obra. || 2.1 Services include: Architectural Project, Structures, MEP, Bill of Quantities, Municipal approval coordination and Construction Supervision.
2.2 El Arquitecto Local será el responsable legal de la tramitación municipal y la responsabilidad decenal ante las autoridades uruguayas. || 2.2 The Local Architect shall be legally responsible for municipal filings and ten-year liability before Uruguayan authorities.
2.3 Los honorarios del arquitecto local habilitado en la República Oriental del Uruguay, así como los honorarios del ingeniero interviniente para el cálculo estructural, se encuentran incluidos dentro del monto fijo de {{doc.honorarios}} y no generarán costos adicionales para el Cliente. ¶ Quedan expresamente excluidos los importes correspondientes a tasas, tributos y aranceles municipales. || 2.3 The fees of the local architect licensed in the Eastern Republic of Uruguay, as well as the fees of the engineer involved in the structural calculations, are included in the fixed amount of {{doc.honorarios}} and will not generate additional costs for the Client. ¶ Amounts corresponding to municipal taxes, duties and fees are expressly excluded.
**CLÁUSULA 3 - DETALLE DOCUMENTACIÓN** || **CLAUSE 3 - DOCUMENTATION DETAILS**
3.1 Gestión municipal: preparación de la documentación, coordinación con los consultores locales y respuestas técnicas a las observaciones municipales. (Plazo de aprobación estimado: 3 meses). || 3.1 Municipal Management: Preparation of documentation, coordination with local consultants and technical responses to municipal observations. (Estimated approval time: 3 months).
3.2 Planos Generales: Implantación, plantas de todos los niveles, cortes, vistas y renders. || 3.2 General Drawings: Site plan, floor plans, sections, elevations, and renders.
3.3 Planos de Detalle: Cortes de muro, detalles de locales y nodos constructivos. || 3.3 Detail Drawings: Wall sections, room layouts, and construction nodes.
3.4 Estructuras e Instalaciones: Planos de replanteo, encofrados, armaduras, sanitaria, eléctrica, gas y HVAC. || 3.4 Structures and MEP: Foundation layouts, formwork, reinforcement, sanitary, electrical, gas, and HVAC.
3.5 Listados y Pliegos: Cómputo métrico, presupuesto detallado y pliego de condiciones para licitación. || 3.5 Schedules and Specs: Bill of quantities, detailed budget, and tender specifications.
**CLÁUSULA 4 - HONORARIOS Y PLAZOS** || **CLAUSE 4 - FEES AND TIMELINES**
4.1 Honorarios: El total asciende a {{doc.honorarios}}. || 4.1 Fees: The total amount is {{doc.honorarios}}.
4.2 Forma de Pago: ¶ {{bloque.forma_pago}} || 4.2 Payment Terms: ¶ {{bloque.forma_pago_en}}
4.3 Plazos y continuidad: Inicio estimado {{obra.inicio}}. Fin estimado {{obra.fin}}. || 4.3 Timelines and Continuity: Estimated Start {{obra.inicio_en}}. Estimated End {{obra.fin_en}}.
NOTA: {{estudio.nombre}} se obliga a continuar con la supervisión y Dirección de Obra hasta alcanzar el 100% de la completitud del proyecto, incluso si los plazos originales sufrieran desfasajes o demoras originadas por motivos de fuerza mayor. || NOTE: {{estudio.nombre}} is bound to continue the supervision and Construction Management until reaching 100% completion of the project, even if the original timelines suffer deviations or delays caused by force majeure events.
**CLÁUSULA 5 - EJECUCIÓN Y RESPONSABILIDADES** || **CLAUSE 5 - EXECUTION AND LIABILITIES**
5.1 Constructor: La ejecución material será realizada por una empresa constructora contratada por el Comitente. || 5.1 Builder: Material execution shall be carried out by a construction company hired by the Client.
5.2 Empresa Constructora: contratada por el comitente. Actuará coordinadamente con la Dirección de Obra, pero no existirá relación laboral ni contractual con {{estudio.nombre}}. || 5.2 Construction company: hired by the Client. Shall coordinate with Supervision, but no employment or contractual relationship shall exist with {{estudio.nombre}}.
5.3 Todo pedido a la obra debe canalizarse exclusivamente a través de {{estudio.nombre}}. || 5.3 All construction site requests must be channeled exclusively through {{estudio.nombre}}.
5.4 Alcance Técnico: La Dirección de Obra controla la ejecución conforme al proyecto, sin asumir funciones del constructor. || 5.4 Technical Scope: Supervision controls execution according to the project, without assuming builder duties.
5.5 Certificación: La obra será certificada mensualmente. Dicha certificación es condición indispensable para pago contratistas. ¶ A tal efecto, {{estudio.nombre}} realizará visitas al lugar de la obra al menos una (1) vez por mes. ¶ Además, {{estudio.nombre}} estará presente en la obra durante las fases clave del proyecto, entre las que se incluyen: ¶ - Inicio de obra ¶ - Días de hormigonado/montaje estructural principal ¶ - Finalización de la estructura ¶ - Finalización de las instalaciones ¶ - Finalización de las terminaciones || 5.5 Certification: Work shall be certified monthly. Such certification is a mandatory condition for the Client to pay contractors. ¶ For this purpose, {{estudio.nombre}} will carry out site visits at least once (1) per month. ¶ Additionally, {{estudio.nombre}} will attend the construction site during key phases of the project, including: ¶ - Construction commencement ¶ - Days of concrete pouring and main structural assembly ¶ - Completion of the structure ¶ - Completion of MEP installations ¶ - Completion of finishes for commissioning
5.6 Recepción Provisoria: Al finalizar, se verificará la obra y se listarán observaciones (pendientes) a subsanar por el constructor. || 5.6 Provisional Reception: Upon completion, work is verified and observations (punch list) are listed for the builder to remedy.
5.7 Recepción Definitiva: Subsanados los pendientes, se firma el Acta Definitiva, finalizando la labor de Dirección de Obra. || 5.7 Final Reception: Once remedied, the Final Act is signed, concluding the Supervision duties.
**CLÁUSULA 6 - PROPIEDAD INTELECTUAL** || **CLAUSE 6 - INTELLECTUAL PROPERTY**
6.1 Los diseños y planos son propiedad intelectual de {{estudio.nombre}}. El Comitente tiene licencia de uso exclusiva para esta obra. || 6.1 Designs and drawings are the intellectual property of {{estudio.nombre}}. The Client has an exclusive license for this project.
**CLÁUSULA 7 - LEY Y JURISDICCIÓN** || **CLAUSE 7 - LAW AND JURISDICTION**
7.1 El contrato se rige íntegramente por las leyes de {{doc.ley}}. || 7.1 The agreement is governed entirely by the laws of {{doc.ley_en}}.
7.2 Las partes se someten a {{doc.tribunales}}, previa mediación. || 7.2 Parties submit to {{doc.tribunales_en}}, following mediation.
En prueba de conformidad, se firman dos ejemplares, uno para cada parte, de un mismo tenor y a un solo efecto, en {{doc.lugar_firma}}, el {{doc.fecha_firma}}. || In witness whereof, this Agreement is executed in two counterparts of the same tenor and to a single effect, one for each party, on this {{doc.fecha_firma_en}}.
:::

{{bloque.firmas}}
`;

// Modelo de contrato del CPAU para obras en Argentina (enviado por el estudio). «El Arquitecto» es el estudio.
const CONTRATO_CPAU = `
# CONTRATO DE PROYECTO Y DIRECCIÓN DE OBRA

Entre {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, en adelante el «Comitente», con domicilio en {{cliente.domicilio}} y correo electrónico {{cliente.email}}, por una parte, y por la otra {{estudio.nombre}}, integrado por {{estudio.firmantes_matricula}}, en adelante el «Arquitecto», con domicilio en {{estudio.domicilio}} y correo electrónico {{estudio.email}}, convienen celebrar el presente contrato. Serán válidas las comunicaciones entre las partes cursadas indistintamente a los domicilios y correos electrónicos precitados.

## CLÁUSULA 1. OBJETO DEL CONTRATO
**1.1** El Comitente encarga al Arquitecto y este acepta la realización del proyecto y dirección de la obra cuyas características principales figuran en 1.2 a 1.7.

**1.2** La obra pertenece al Grupo: {{doc.grupo_cpau}}.

**1.3** El destino de la obra es: {{obra.tipologia}}.

**1.4** La ubicación de la obra es: {{obra.ubicacion}}.

**1.5** La superficie cubierta estimada es de {{obra.superficie_cubierta}} y el monto tentativo de la obra, incluido el impuesto al valor agregado, es de {{doc.monto_obra}}.

**1.6** El plazo estimado previsto para la construcción de la obra es de {{doc.plazo_obra}} días hábiles.

**1.7** La modalidad prevista para la contratación y construcción de la obra es {{doc.modalidad}}.

## CLÁUSULA 2. SERVICIOS PROFESIONALES
**2.1** En base al programa de necesidades proporcionado por el Comitente y los ajustes que posteriormente puedan acordar las partes, el Arquitecto confeccionará el programa de necesidades definitivo.

**2.2** En base al programa de necesidades definitivo, el Arquitecto tendrá a su cargo la prestación de los servicios profesionales de croquis preliminar, anteproyecto, documentación de proyecto, llamado a licitación, estudio de propuestas y dirección de obra, de acuerdo con lo establecido en el documento CPAU A-115 y la doctrina del Consejo.

**2.3** Los servicios profesionales mencionados en 2.2 comprenden los correspondientes a obras de arquitectura, estructuras e instalaciones e incluyen las tareas siguientes: {{doc.tareas}}.

**2.4** Los servicios profesionales serán prestados en función de lo establecido en 1.2 a 1.7 y en cada caso se basarán en la etapa anterior aprobada por el Comitente.

**2.5** El Arquitecto prestará además los siguientes servicios profesionales, no incluidos en el servicio de proyecto y dirección: {{doc.servicios_adicionales}}.

**2.6** El Comitente abonará, a medida que se produzcan, los gastos especiales que se puedan originar:

- **Trámites y tasas:** pago de sellados, impuestos o derechos ante empresas de servicios y entes públicos.
- **Personal de obra:** sueldos, cargas sociales y seguros de técnicos y auxiliares destacados en obradores o que trabajen por tiempo.
- **Estudios técnicos:** sondeos, ensayos, replanteos de linderos, actas notariales, consultas a especialistas.
- **Documentación y gráfica:** fotos aéreas o satelitales, videos, maquetas, pitch público.
- **Otros:** cualquier gasto imprevisto necesario para cumplir el encargo.

## CLÁUSULA 3. HONORARIOS Y FORMA DE PAGO
**3.1** El Comitente pagará al Arquitecto, por la prestación de los servicios profesionales citados en 2.2, honorarios de {{doc.honorarios}}.

**3.2** El Comitente pagará al Arquitecto, por la prestación de los servicios profesionales citados en 2.5, los honorarios siguientes: {{doc.monto_adicionales}}.

**3.3** El Comitente tendrá a su cargo el pago de los honorarios que se originen por la prestación de los servicios y tareas profesionales que no figuran expresamente encomendados en 2.5.

**3.4** Salvo acuerdo en contrario, los honorarios que puedan surgir por aplicación de lo dispuesto en 3.3, 4.1 f) y 5.4 serán los que figuran en el documento CPAU A-115 y, de no ser posible, se calcularán según el tiempo empleado aplicando una tarifa de {{doc.tarifa_hora}} por hora.

**3.5** Los honorarios indicados en esta cláusula serán facturados de acuerdo con el siguiente detalle:

{{bloque.forma_pago}}

En cada factura el Arquitecto agregará a los honorarios el impuesto al valor agregado que corresponda.

**3.6** El Comitente dispondrá de 10 días para aprobar las facturas de honorarios; vencido dicho plazo sin observarlas, dispondrá de 5 días más para pagarlas.

## CLÁUSULA 4. PLAZOS
**4.1** El Arquitecto cumplirá las tareas a su cargo dentro de los plazos siguientes: a) croquis preliminar, dentro de los 7 días de aprobado el programa de necesidades definitivo; b) anteproyecto, dentro de los 21 días de aprobado el croquis preliminar; c) documentación de proyecto, dentro de los 30 días de aprobado el anteproyecto; d) llamado a licitación, dentro de los 14 días de aprobada la documentación de licitación; e) estudio de propuestas, dentro de los 14 días de recibidas las propuestas; f) dirección de obra, durante el plazo previsto en 1.6 para la ejecución de la obra. En caso de prolongación de este último plazo, por causa ajena a la responsabilidad del Arquitecto, este tendrá derecho al cobro de honorarios adicionales.

**4.2** El Comitente dispondrá de un plazo de 7 días para aprobar o presentar observaciones a las tareas realizadas por el Arquitecto mencionadas en 4.1 a), b) y c), cumplido el cual la tarea se considerará aprobada. Si el Comitente formulase observaciones, las partes acordarán el plazo para que sean resueltas. A la terminación de cada etapa las partes dejarán constancia de su conformidad con su firma y fecha en dos copias de la documentación aprobada.

**4.3** Los plazos se contarán en días corridos. Serán causal de prórroga, siempre que originen demoras a las tareas del Arquitecto: a) los lapsos empleados por el Comitente o los entes con jurisdicción sobre la obra para responder consultas y, en el caso de estos últimos, para registrar presentaciones u otorgar aprobaciones; b) los lapsos necesarios para el estudio de modificaciones, y c) caso fortuito o fuerza mayor.

## CLÁUSULA 5. MODIFICACIONES
**5.1** No se ejecutarán modificaciones al proyecto o a la obra sin la aprobación del Arquitecto y del Comitente.

**5.2** Se considerarán modificaciones: a) las ampliaciones o disminuciones de superficie del proyecto; b) los cambios que se introduzcan a la categoría, destino, ubicación o modalidad de contratación de la obra establecidos en 1.2 a 1.7; c) los cambios que se introduzcan al programa de necesidades definitivo, croquis preliminar, anteproyecto o documentación de proyecto terminados o en ejecución, en su totalidad o en alguna de sus partes; d) los cambios que se introduzcan a la obra o a los trabajos en ejecución.

**5.3** El Arquitecto podrá introducir ajustes menores durante la ejecución de la obra siempre que no impliquen modificaciones al diseño ni a los precios y plazos contractuales.

**5.4** El Arquitecto tendrá derecho al cobro de honorarios adicionales por la introducción de modificaciones ordenadas por el Comitente, siempre que le originen la reejecución de tareas, la ejecución de nuevas tareas o la asunción de nuevas responsabilidades. Los ajustes menores no generarán honorarios.

**5.5** El Arquitecto tendrá derecho a prórroga de los plazos contractuales por la introducción de modificaciones ordenadas por el Comitente siempre que le originen la reejecución de tareas o la ejecución de otras nuevas.

## CLÁUSULA 6. OBLIGACIONES DE LAS PARTES
**6.1** El Arquitecto registrará en el CPAU la encomienda objeto de este contrato y ajustará su actividad a las disposiciones del Código de Ética.

**6.2** El Arquitecto se obliga a: a) cumplir las disposiciones que en los pliegos de condiciones figuran a cargo del Director de obra; b) no permitir el comienzo de la obra hasta que no se cuente con i) el aviso o permiso de obra otorgado por {{doc.autoridad}}, ii) el plan aprobado de higiene y seguridad, la designación de un profesional en higiene y seguridad y de un contratista a cargo de dichas prestaciones; c) informar al Comitente periódicamente acerca del avance de los trabajos a su cargo; d) proporcionar al Comitente planos conforme a obra cuando estos no estén a cargo del o de los contratistas.

**6.3** El Arquitecto no está obligado a concurrir diariamente a la obra ni a permanecer en ella durante toda la jornada de trabajo. El Arquitecto o sus representantes deben visitar la obra con la frecuencia apropiada en función de su grado de avance y del tipo de trabajos en ejecución, a efectos de controlar su correspondencia con la documentación contractual. En caso de que fuese requerido el ejercicio de controles durante toda la jornada laboral, el Comitente se hará cargo de la retribución del personal técnico correspondiente.

**6.4** El Arquitecto deberá contar con la previa autorización del Comitente para ordenar la ejecución de trabajos que impliquen modificaciones, adicionales o economías a los precios contractuales, para conceder prórrogas o extensiones a los plazos contractuales y para incurrir en gastos especiales.

**6.5** El Arquitecto tendrá a su cargo: a) la retribución de profesionales, dibujantes, operadores de diseño asistido y personal técnico necesario para la ejecución de las tareas mencionadas en la Cláusula 2; b) el costo de dos juegos de copias de los planos y escritos resultado de las tareas a su cargo, uno de los cuales, firmado por el Comitente, permanecerá en poder del Arquitecto.

**6.6** El Comitente se obliga a: a) cooperar con el Arquitecto en toda gestión que requiera su participación; b) responder con razonable prontitud las consultas que este le formule; c) encauzar por intermedio del Arquitecto todo pedido vinculado con el proyecto o la obra en ejecución, o dirigido a profesionales o personal de su estudio o de la obra, especialistas, contratistas, capataces o proveedores; d) no efectuar pagos a contratistas o proveedores sin contar previamente con la certificación del Arquitecto; e) no ordenar al constructor ni a persona alguna el comienzo de la obra hasta tanto no se cuente con el aviso o permiso de obra otorgado por {{doc.autoridad}}.

**6.7** El Comitente asume plena y total responsabilidad, exclusiva y excluyente, e indemnizará y mantendrá indemne al Director de obra por cualquier daño o contingencia de índole civil, administrativa o penal que deba afrontar en forma directa o indirecta, en su persona o bienes, por cualquier acción, error u omisión relacionados con la inobservancia de las obligaciones por parte de contratistas, subcontratistas o del personal empleado o contratado por el Comitente, en relación con el cumplimiento de las disposiciones oficiales laborales y previsionales que condicionan los trabajos a su cargo.

## CLÁUSULA 7. PROPIEDAD INTELECTUAL
**7.1** El proyecto de la obra y los documentos que lo integran, sobre cualquier tipo de soporte, son propiedad intelectual del Arquitecto, quien tiene derecho a su registro. Cuando las documentaciones confeccionadas por el Arquitecto han sido representadas mediante procedimientos informáticos, el Comitente tiene derecho a recibir una copia del soporte magnético y será responsable de asegurar que el mismo no sufra alteración alguna.

**7.2** El Arquitecto tiene derecho a publicar y difundir dibujos, planos, fotografías, renders, films y videos del proyecto, de la obra en ejecución y del edificio terminado.

**7.3** El anteproyecto y la documentación de proyecto no podrán ser utilizados por el Comitente, parcial o totalmente, en otros proyectos, ni ser enajenados a tales efectos.

## CLÁUSULA 8. RESOLUCIÓN DE CONFLICTOS
**8.1** Las partes acuerdan someter toda controversia emergente de este contrato, en una primera instancia, al procedimiento de mediación. De no lograrse acuerdo, el o los puntos controvertidos pendientes serán sometidos al laudo de una pericia arbitral, de acuerdo con lo establecido en el artículo 773 del Código Procesal Civil y Comercial de la Nación.

**8.2** Las partes y los árbitros suscribirán el compromiso arbitral fijando plazo para emitir el laudo, la renuncia de las partes a los recursos de apelación y de nulidad, salvo los casos determinados en el artículo 760 del CPCC de la Nación, y los honorarios de los árbitros, quienes procederán sin sujeción a las formas legales.

## CLÁUSULA 9. RESOLUCIÓN DEL CONTRATO
**9.1** El Comitente podrá resolver el contrato en los siguientes casos: a) si el Arquitecto violase las estipulaciones contractuales; b) si el Arquitecto abandonase las tareas a su cargo por un plazo que supere los 30 días, salvo caso fortuito o fuerza mayor. En estos casos el Arquitecto tendrá derecho al cobro de honorarios por los trabajos realizados y el Comitente a daños y perjuicios.

**9.2** El Arquitecto podrá resolver el contrato en los siguientes casos: a) si el Comitente violase las estipulaciones contractuales; b) si el Comitente ordenase la suspensión de las tareas a cargo del Arquitecto por un lapso que supere los 30 días, salvo caso fortuito o fuerza mayor; c) si el Comitente discontinuase el comienzo de la obra con respecto a la fecha de terminación del proyecto por un lapso que supere los 15 días, salvo caso fortuito o fuerza mayor; d) si por causa imputable al Comitente la construcción de la obra superase en más de 21 días el plazo previsto en 4.1 f), salvo caso fortuito o fuerza mayor. En estos casos el Arquitecto tendrá derecho al cobro de los honorarios devengados al momento de la resolución y a la indemnización prevista en el art. 1.18 del documento CPAU A-115.

**9.3** El Comitente tiene el derecho de desistir del contrato por su sola voluntad, pagando al Arquitecto las tareas realizadas y la indemnización dispuesta en el art. 1.18 del documento CPAU A-115.

## CLÁUSULA 10. OTROS ACUERDOS DE LAS PARTES
{{doc.otros_acuerdos}}

En prueba de conformidad se firman dos ejemplares iguales, uno para cada parte, en {{doc.lugar_firma}}, el {{doc.fecha_firma}}.

{{bloque.firmas}}
`;

const NOTA_PRESENTACION = `
{{doc.lugar}}, {{doc.fecha}}

**A la {{doc.destinatario}}**

Presentación de proyecto y declaración de conformidad - {{doc.referencia}}

De mi consideración:

Por medio de la presente, {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, propietario de {{doc.referencia}}, me presento ante esta Comisión con el propósito de introducir el proyecto residencial a desarrollarse en dicho lote.

A tal fin, autorizo formalmente a {{doc.estudio_presentante}} a realizar la presentación de los planos, renders, memorias y toda la documentación técnica requerida para la correspondiente revisión y aprobación de la obra.

Asimismo, mediante esta nota, el propietario, el arquitecto proyectista y el director de obra declaramos bajo juramento tener pleno conocimiento, conformidad y asumir el compromiso formal de cumplir con el Reglamento de Edificación vigente del barrio, así como con sus eventuales futuras enmiendas aprobadas por la Administración o por la asamblea de copropietarios cuando esta entre en funciones.

Sin otro particular, firmamos al pie en conformidad.

Atentamente,

**{{cliente.nombre}}** · DNI/CUIT {{cliente.dni_cuit}} · Propietario de {{doc.referencia}}

{{doc.apoderado}}

**Arquitecto proyectista:** {{doc.proyectista}}

**Director de obra:** {{doc.director_obra}}
`;

const CLAUSULAS = `
## Cláusulas
*[Pegar acá las cláusulas del modelo de contrato revisado por el abogado del estudio, desde Plantillas. El panel completa los datos y da formato, pero no redacta cláusulas.]*
`;

function parte(f: Firmante) {
  if (f === "cliente") return "**Comitente:** {{cliente.nombre}}, DNI/CUIT {{cliente.dni_cuit}}, con domicilio en {{cliente.domicilio}}.";
  if (f === "estudio") return "**Estudio:** {{estudio.nombre}}, {{estudio.firmantes}}.";
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

**{{obra.titulo}}** · {{obra.ubicacion}}

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
    case "contrato_cpau":
      return CONTRATO_CPAU;
    case "nota_presentacion":
      return NOTA_PRESENTACION;
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
