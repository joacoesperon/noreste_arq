# Noreste Arq

Portfolio público de norestearq.com + panel privado del estudio en `/admin`.
Requisitos del panel: `docs/alcance-panel-estudio.pdf` y `docs/Noreste_Modificaciones_Web_v1.pdf`; lo que falta pedirle al estudio, en `docs/pedidos-al-estudio.md`. Se entrega por etapas (0 base/seguridad, 1 obras, 2 documentos, 3 archivos y tablero, 4 presupuestador).

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
- Modelo inicial en `src/lib/cronogramas/modelos.ts`: etapas de la pregunta 10 con duraciones PROVISORIAS, escaladas por m², tipología y plazos de la obra. Reemplazar cuando el estudio mande un cronograma real.
- UI: pestaña «Cronogramas» de la ficha (`src/components/admin/cronogramas/`: Gantt por mes + editor en tabla).

## Documentos (etapa 2)

- Tablas `plantillas` (solo si el estudio editó una; si no, se usa la base de `src/lib/documentos/plantillas-base.ts`), `documentos` (borrador TipTap + `datos`) y `documento_versiones` (congeladas: guardan los `bloques` ya resueltos; se crean con `crear_version_documento`).
- Tipos y campos propios en `src/lib/documentos/tipos.ts`; datos disponibles `{{obra.*}}`, `{{cliente.*}}`, `{{doc.*}}`, `{{bloque.*}}` en `datos.ts`. `resolver.ts` convierte plantilla + datos → `Bloque[]`, que leen la vista previa (`vista-documento.tsx`), el PDF (`pdf.tsx`, @react-pdf, Helvetica) y el Word (`docx.ts`). Todo se genera en el navegador.
- Las plantillas base son PROVISORIAS; los contratos no traen cláusulas (las aporta el estudio). Marca en texto en vez del logo PNG (tiene fondo) hasta recibir el vector.
- Números: `parseNumero` (`formato.ts`) acepta formato argentino («3.500.000», «1.250,5»).

## Tablero, archivos y visor (etapa 3)

- Tareas: `tareas` + `tarea_eventos` (historial). Tipo `entrega` = entrega de documentación: checklist del PDF (`src/lib/tareas/checklist.ts`, ids estables) y aprobación de otra persona; la restricción `entrega_aprobada` lo garantiza en la base. Acciones en `admin/(panel)/tareas/actions.ts`; UI en `src/components/admin/tareas/` (el detalle es un Sheet dentro de `TareasProvider`).
- El tablero (`/admin`) agrupa por semana (lunes a domingo, hora de Buenos Aires): `src/lib/tareas/semanas.ts`.
- Archivos: bucket privado `obra-archivos` + tabla `archivos`. Se suben desde el navegador (`src/lib/supabase/client.ts`) y se registran con `registrarArchivo`; se descargan con links firmados cortos.
- Visor IFC: That Open Engine (`src/components/visor/visor-ifc.tsx`). Worker y WASM se copian a `public/visor/` en `postinstall`. **web-ifc fijado en 0.0.77**: el paquete 0.0.78 trae el JS y el WASM desincronizados. Links para clientes: `visor_links` + función pública `visor_compartido(token)`; página pública en `src/app/visor/[token]` (root layout propio).
- Pendiente: aviso por correo al revisor — falta proveedor de correo y DNS del dominio. El correo diario y el reporte semanal a clientes quedan para después de terminar el sistema.

## Comandos

`npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit`
