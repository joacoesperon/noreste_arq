# Noreste Arq

Portfolio público de norestearq.com + panel privado del estudio en `/admin`.
Requisitos del panel: `docs/alcance-panel-estudio.pdf` y `docs/Noreste_Modificaciones_Web_v1.pdf`; manual para el estudio en `docs/Manual del panel - noreste arq.pdf`. Se entrega por etapas (0 base/seguridad, 1 obras, 2 documentos, 3 archivos y tablero, 4 presupuestador).

## Estructura

- `src/app/(site)/` — sitio público. Root layout propio con `globals.css` (estilos a medida, GSAP). **No usar shadcn acá.**
- `src/app/admin/` — panel del estudio. Root layout propio con `admin.css`. **UI con shadcn/ui** (`npx shadcn@latest add <componente>`; `components.json` apunta a `admin.css`). Componentes del panel en `src/components/admin/`, primitivas en `src/components/ui/`.
  - `admin/login` — login (server action en `admin/actions.ts`).
  - `admin/(panel)/` — secciones con menú lateral (`components/admin/app-sidebar.tsx`).
- Los dos root layouts no comparten CSS: los estilos globales del sitio (tamaños en `p/span/button`, tokens `--color-*`) romperían shadcn.

## Auth y datos

- Supabase Auth, un usuario por persona. Acceso al panel = fila activa en `public.staff`.
- `src/proxy.ts` exige sesión en `/admin/*` y `/api/*`. Las API usan `authorizeApi()` (`src/lib/auth.ts`), que además verifica staff.
- En el panel y las API usar `createClient()` de `src/lib/supabase/server.ts` (sesión del usuario, pasa por RLS). El cliente anónimo `src/lib/supabase.ts` es solo para lecturas del sitio público.
- Toda tabla nueva: RLS activado con políticas `public.is_staff()`. Migraciones en `supabase/migrations/`.
- No usar la service role salvo del lado del servidor y cuando RLS no alcance.
- Desarrollo usa el Supabase propio `noreste-dev` (`.env.local`, CLI enlazada). Tras cada migración: `npx supabase db push` y regenerar tipos con `npx supabase gen types typescript --linked --schema public > src/lib/database.types.ts`.
- Producción: Supabase `aqfbxebcyifaerlripgj` (Vercel Production). Las migraciones nuevas se aplican con `python3 scripts/aplicar-migraciones.py aqfbxebcyifaerlripgj` (API de administración, sin contraseña; saltea lo ya aplicado) y los usuarios se crean con `scripts/crear-usuario.mjs`.

## Obras (etapa 1)

- Datos: `clientes`, `obras`, `obra_sectores`, `obra_colaboradores`, `obra_especialidades`. Las listas hijas se reemplazan con la función `reemplazar_listas_obra` (atómica).
- Lógica en `src/lib/obras/` (constantes, esquemas zod, consultas, superficies). Las listas de tipologías/servicios/especialidades están en `constants.ts`, no en la base.
- UI en `src/app/admin/(panel)/obras/`: listado, ficha (`[id]`) y asistente de carga (`[id]/editar?paso=N`, `nueva`). Una obra con `borrador = true` está a medio cargar; la misma pantalla del asistente sirve para editar un paso de una obra terminada.
- Server actions en `obras/actions.ts` (`guardarPaso`, `finalizarCarga`, `eliminarObra`).

## Cronogramas (parte de la etapa 2)

- `cronogramas` (uno de proyecto y uno de obra por obra) + `cronograma_etapas` (inicio/fin, `clave`). Se guardan con la función `guardar_cronograma` (atómica), que además crea/mueve/borra la tarea de cada fecha clave (`tareas.cronograma_etapa_id`).
- Modelo inicial en `src/lib/cronogramas/modelos.ts`: etapas y «qué incluye» del cronograma real de Casa Tots (anteproyecto, proyecto, obra húmeda, terminaciones, equipamiento fijo, semicubiertos), escaladas por m², tipología y plazos de la obra. Cada etapa tiene `detalle` (una línea por ítem).
- UI: pestaña «Cronogramas» de la ficha (`src/components/admin/cronogramas/`: Gantt por mes + editor en tabla).

## Documentos (etapa 2)

- Tablas `plantillas` (solo si el estudio editó una; si no, se usa la base de `src/lib/documentos/plantillas-base.ts`), `documentos` (borrador TipTap + `datos`) y `documento_versiones` (congeladas: guardan los `bloques` ya resueltos; se crean con `crear_version_documento`).
- Tipos y campos propios en `src/lib/documentos/tipos.ts`; datos disponibles `{{obra.*}}`, `{{cliente.*}}`, `{{doc.*}}`, `{{bloque.*}}` en `datos.ts`. `resolver.ts` convierte plantilla + datos → `Bloque[]`, que leen la vista previa (`vista-documento.tsx`), el PDF (`pdf.tsx`, @react-pdf, Helvetica) y el Word (`docx.ts`). Todo se genera en el navegador.
- Identidad (material del estudio en `docs/1..8`, fuera de git): diseño de la plantilla NE26 (encabezado fecha/@instagram/correo + logo; pie con teléfonos), colores #181818/#555555/#c0c0c4/#f8f8f8, logo e isotipo en `public/images/marca/`. Tipografía Helvetica: las Neue Haas recibidas son trial (sin tildes ni ñ) y no tienen licencia.
- Datos del estudio (firmantes con DNI, teléfonos, correo, Instagram) en la tabla `estudio_config`, editables en Plantillas → Datos del estudio. **El repo es público: nada de DNI ni datos personales en el código.**
- Contrato para obras en Argentina (`contrato_cpau`): modelo CPAU que mandó el estudio; «el Arquitecto» es el estudio (`{{estudio.firmantes_matricula}}`, `{{estudio.domicilio}}`). Firma digital: link a Firmar.gob.ar en «Descargar» de los contratos; el PDF firmado se sube a Archivos → Contratos firmados.
- Honorarios: `src/lib/honorarios/calculo.ts` (planilla «NE - CAJA»: % del costo de obra por tipo y m², reparto proyecto/dirección, anteproyecto/municipal/ejecutivo, dirección ejecutiva ×2, IVA). Editable en Plantillas → Honorarios (`estudio_config.honorarios`, null = valores del código). Botón «Calcular» en los campos `honorarios*` de los documentos.
- Plantillas base: contrato de proyecto y dirección de obra = texto real NE26 bilingüe (bloque en columnas, `::: columnas` en `markdown.ts`; idioma «solo español» toma la primera columna); propuesta con `{{bloque.etapas}}` (detalle de cada etapa del cronograma) y forma de pago por hitos; nota de presentación de proyecto. Presupuesto y otros contratos siguen provisorios (no se redactan cláusulas).
- Carátula/contratapa negras opcionales (campo `caratula`): bloques `portada`/`contratapa`.
- Números: `parseNumero` (`formato.ts`) acepta formato argentino («3.500.000», «1.250,5»).

## Tablero, archivos y visor (etapa 3)

- Tareas: `tareas` + `tarea_eventos` (historial). Tipo `entrega` = entrega de documentación: checklist del PDF (`src/lib/tareas/checklist.ts`, ids estables) y aprobación de otra persona; la restricción `entrega_aprobada` lo garantiza en la base. Acciones en `admin/(panel)/tareas/actions.ts`; UI en `src/components/admin/tareas/` (el detalle es un Sheet dentro de `TareasProvider`).
- El tablero (`/admin`) agrupa por semana (lunes a domingo, hora de Buenos Aires): `src/lib/tareas/semanas.ts`.
- Archivos: bucket privado `obra-archivos` + tabla `archivos`. Se suben desde el navegador (`src/lib/supabase/client.ts`) y se registran con `registrarArchivo`; se descargan con links firmados cortos.
- Visor IFC: That Open Engine (`src/components/visor/visor-ifc.tsx`). Worker y WASM se copian a `public/visor/` en `postinstall`. **web-ifc fijado en 0.0.77**: el paquete 0.0.78 trae el JS y el WASM desincronizados. Links para clientes: `visor_links` (`expires_at` null = sin vencimiento); la página pública `src/app/visor/[token]` (root layout propio) busca el link y genera un acceso de 1 hora al archivo en cada visita con la service role (`src/lib/supabase/admin.ts`, env `SUPABASE_SERVICE_ROLE_KEY`, solo servidor). Revocar = borrar la fila, corta el acceso en el acto.
- El correo diario y el reporte semanal a clientes quedan para después de terminar el sistema.

## Gastos de obra

- `obra_gastos` (fecha, rubro, detalle, monto en ARS o USD, `cotizacion` = pesos por dólar del día, `pagado` false = previsto, `sin_recibo`) y `obra_gremios` (monto acordado → saldo). Pestaña «Gastos» de la obra (`src/components/admin/gastos/`), acciones en `obras/gastos-actions.ts`.
- Cotización: dólar blue compra (`src/lib/gastos/cotizacion.ts`; ArgentinaDatos para fechas pasadas, DolarAPI para hoy). Se completa sola y se puede editar.
- Importar planilla (como «Casa Tots.xlsx»): mapeo de columnas, saltea subtotales; exportar a CSV para Excel.

## Presupuestador (etapa 4)

- Datos: `materiales` (catálogo propio, incluye mano de obra; `codigo` = parámetro compartido de Revit), `proveedores` (con lat/lng), `listas_precios`, `precios` (historial con fuente y fecha; vista `precios_vigentes` = último por material y proveedor), `material_equivalencias` (cómo nombra cada proveedor a un material: las listas siguientes se asocian solas), `presupuestos` + `presupuesto_items` (guardan copia de descripción, proveedor y precio).
- Ubicación con Nominatim/OpenStreetMap (`src/lib/presupuestador/geocodificar.ts`, de lo más preciso a la localidad). Radio por presupuesto (25 km por defecto, pregunta 14); proveedores sin ubicar cuentan como dentro.
- Importación en el navegador (`leer-tabla.ts`): .xlsx con read-excel-file, .csv/.txt con papaparse (detecta UTF-16 de Revit y saltea filas de título). Mapeo de columnas en `mapeo-columnas.tsx`. Cantidades de Revit por código (T7, opción A).
- UI: `/admin/presupuestador` (presupuestos, materiales, proveedores, listas) y la pestaña «Presupuestos» de la obra; editor en `obras/[id]/presupuestos/[presId]`. Export PDF/Word con el motor de documentos.
- Revit: `filasComputo` saltea filas de grupo y subtotales («C100: 14», «Total general») del CSV real del estudio.
- Listas en PDF: `leerPdf` (pdf.js, worker copiado a `public/vendor/` en postinstall) arma filas por posición del texto; opción de sumar IVA al importar.
- Precios web: proveedores con `web_dominio` (tiendas VTEX: Easy, Prestigio). En cada material «Buscar en la web» → vincular producto (`material_productos_web`); cron semanal `/api/cron/precios` actualiza. Solo se consultan dominios cargados en un proveedor (`src/lib/presupuestador/vtex.ts`).
- Índice CAC: tabla `indices_cac` (carga mensual a mano en Presupuestador → Índice CAC); el presupuesto se actualiza desde su mes base (`cac_base`).
- Recordatorio mensual a proveedores: cron `/api/cron/recordatorios` (correo + tarea con botones de WhatsApp `wa.me`).

## Correos y tareas programadas

- `src/lib/correo.ts` (Resend). Variables: `RESEND_API_KEY`, `CORREO_DE`, `CORREO_SOLO_A` (modo prueba: solo esas direcciones), `NEXT_PUBLIC_SITE_URL`. Sin clave no se envía nada (solo log).
- Avisos de entregas: al revisor al enviar a revisión, y al responsable al aprobar o devolver. El link `/admin?tarea=<id>` abre la tarea.
- Crons en `vercel.json`, autenticados con `CRON_SECRET` (el proxy deja pasar `/api/cron/*`); usan la service role (`src/lib/supabase/admin.ts`).

## Notas

- `reactCompiler` está activo: en handlers no usar `x!.prop` sobre estado que puede ser null; el compilador puede leer esa propiedad al renderizar. Usar una guardia (`if (!x) return`).

## Comandos

`npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit`
