import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import type { Membrete } from "@/lib/documentos/estudio";
import { etiquetaMes, rangoMeses } from "@/lib/cronogramas/rango";

// Diseño de la plantilla NE26 del estudio y colores del manual de identidad.
// Tipografía: Helvetica (estándar del PDF). Las Neue Haas recibidas son versiones de prueba
// sin tildes ni eñe, y su licencia no permite usarlas.

// Sin cortes de palabra con guión (react-pdf los hace por defecto y parte CUIT, DNI y palabras).
Font.registerHyphenationCallback((palabra) => [palabra]);

const TINTA = "#181818";
const GRIS = "#555555";
const LINEA = "#c0c0c4";
const FONDO = "#f8f8f8";
const AMBAR = "#f59e0b";

const s = StyleSheet.create({
  page: { paddingTop: 112, paddingBottom: 72, paddingHorizontal: 52, fontFamily: "Helvetica", fontSize: 10, color: TINTA, lineHeight: 1.5 },
  header: { position: "absolute", top: 32, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTexto: { fontSize: 8, color: GRIS, lineHeight: 1.6 },
  footer: { position: "absolute", bottom: 30, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", fontSize: 7.5, color: GRIS, lineHeight: 1.5 },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 6, lineHeight: 1.25 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4, lineHeight: 1.3 },
  h3: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 },
  p: { marginBottom: 5, minHeight: 6 },
  li: { flexDirection: "row", marginBottom: 2 },
  liMarca: { width: 12 },
  fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINEA, paddingVertical: 3 },
  celda: { flex: 1, paddingHorizontal: 2 },
  negra: { backgroundColor: TINTA, color: "#ffffff", padding: 0 },
});

function Runs({ runs, negrita }: { runs: Run[]; negrita?: boolean }) {
  return (
    <>
      {runs.map((r, i) => {
        const b = r.b || negrita;
        return (
          <Text
            key={i}
            style={{
              fontFamily: b && r.i ? "Helvetica-BoldOblique" : b ? "Helvetica-Bold" : r.i ? "Helvetica-Oblique" : "Helvetica",
              textDecoration: r.u ? "underline" : undefined,
              backgroundColor: r.falta ? "#fef3c7" : undefined,
            }}
          >
            {r.texto}
          </Text>
        );
      })}
    </>
  );
}

function GanttPdf({ etapas }: { etapas: { nombre: string; inicio: string; fin: string; clave: boolean }[] }) {
  const r = rangoMeses(etapas);
  const conAnio = r.inicio.slice(0, 4) !== r.fin.slice(0, 4);
  return (
    <View style={{ marginVertical: 8 }} wrap={false}>
      <View style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINEA }}>
        <Text style={{ width: "32%", fontSize: 7.5, color: GRIS, paddingBottom: 3 }}>Etapa</Text>
        <View style={{ width: "68%", position: "relative", height: 14 }}>
          {r.meses.map((m) => (
            <Text key={m} style={{ position: "absolute", left: `${r.pos(m)}%`, fontSize: 7, color: GRIS, paddingLeft: 2 }}>
              {etiquetaMes(m, conAnio)}
            </Text>
          ))}
        </View>
      </View>
      {etapas.map((e, i) => {
        const hito = e.inicio === e.fin;
        return (
          <View key={i} style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: FONDO, minHeight: 16 }}>
            <Text style={{ width: "32%", fontSize: 7.5, paddingVertical: 3, paddingRight: 4 }}>
              {e.nombre}
              {e.clave ? " •" : ""}
            </Text>
            <View style={{ width: "68%", position: "relative" }}>
              {r.meses.map((m) => (
                <View key={m} style={{ position: "absolute", left: `${r.pos(m)}%`, top: 0, bottom: 0, borderLeftWidth: 0.4, borderLeftColor: LINEA }} />
              ))}
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  height: 8,
                  left: `${r.pos(e.inicio)}%`,
                  width: hito ? 6 : `${Math.max(r.ancho(e), 0.8)}%`,
                  backgroundColor: e.clave || hito ? AMBAR : GRIS,
                  borderRadius: hito ? 3 : 1,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BloquePdf({ b }: { b: Bloque }) {
  switch (b.t) {
    case "titulo":
      return (
        <Text style={b.nivel === 1 ? s.h1 : b.nivel === 2 ? s.h2 : s.h3} minPresenceAhead={40}>
          <Runs runs={b.runs} negrita />
        </Text>
      );
    case "parrafo":
      return (
        <Text style={s.p}>
          <Runs runs={b.runs} />
        </Text>
      );
    case "lista":
      return (
        <View style={{ marginBottom: 5 }}>
          {b.items.map((item, i) => (
            <View key={i} style={s.li} wrap={false}>
              <Text style={s.liMarca}>{b.ordenada ? `${i + 1}.` : "•"}</Text>
              <Text style={{ flex: 1 }}>
                <Runs runs={item} />
              </Text>
            </View>
          ))}
        </View>
      );
    case "tabla": {
      const flex = (j: number) => (j === 0 ? 3 : 1);
      return (
        <View style={{ marginVertical: 6 }}>
          <View style={[s.fila, { borderBottomWidth: 1, borderBottomColor: TINTA }]}>
            {b.columnas.map((c, j) => (
              <Text key={j} style={[s.celda, { flex: flex(j), fontFamily: "Helvetica-Bold", textAlign: b.derecha?.includes(j) ? "right" : "left" }]}>
                {c}
              </Text>
            ))}
          </View>
          {b.filas.map((f, i) => (
            <View
              key={i}
              wrap={false}
              style={[
                s.fila,
                f.tipo === "seccion" ? { backgroundColor: FONDO } : {},
                f.tipo === "total" ? { borderTopWidth: 1, borderTopColor: TINTA, borderBottomWidth: 0 } : {},
              ]}
            >
              {f.celdas.map((c, j) => (
                <Text
                  key={j}
                  style={[
                    s.celda,
                    {
                      flex: flex(j),
                      textAlign: b.derecha?.includes(j) ? "right" : "left",
                      fontFamily: f.tipo === "total" || f.tipo === "seccion" ? "Helvetica-Bold" : "Helvetica",
                      color: f.tipo === "subtotal" ? GRIS : TINTA,
                    },
                  ]}
                >
                  {c}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case "columnas":
      return (
        <View style={{ marginBottom: 2 }}>
          {b.filas.map((fila, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 18 }}>
              {fila.map((celda, j) => (
                <View key={j} style={{ flex: 1 }}>
                  {celda.map((x, k) => (
                    <BloquePdf key={k} b={x} />
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    case "gantt":
      return <GanttPdf etapas={b.etapas} />;
    case "firmas":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 28, marginTop: 56 }} wrap={false}>
          {b.partes.map((p, i) => (
            <View key={i} style={{ flexGrow: 1, flexBasis: 140, borderTopWidth: 0.8, borderTopColor: TINTA, paddingTop: 4, alignItems: "center" }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.nombre}</Text>
              <Text style={{ fontSize: 8, color: GRIS }}>{p.rol}</Text>
            </View>
          ))}
        </View>
      );
    case "separador":
      return <View style={{ borderBottomWidth: 0.5, borderBottomColor: LINEA, marginVertical: 8 }} />;
    case "portada":
    case "contratapa":
      return null;
  }
}

export function DocumentoPdf({
  documento,
  membrete,
  base,
  fecha,
}: {
  documento: DocumentoResuelto;
  membrete: Membrete;
  /** Origen del sitio, para cargar el logo y el isotipo. */
  base: string;
  /** Fecha del encabezado, YYYY-MM-DD */
  fecha: string;
}) {
  const portada = documento.bloques.find((b) => b.t === "portada");
  const contratapa = documento.bloques.some((b) => b.t === "contratapa");
  const cuerpo = documento.bloques.filter((b) => b.t !== "portada" && b.t !== "contratapa");

  return (
    <Document title={documento.titulo} author={membrete.nombre} creator="Panel noreste arq">
      {portada?.t === "portada" && (
        <Page size="A4" style={s.negra}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={`${base}/images/marca/isotipo-blanco.png`} style={{ width: 110 }} />
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 40, textAlign: "center", paddingHorizontal: 60 }}>{portada.titulo}</Text>
            {portada.subtitulo && <Text style={{ fontSize: 9, color: LINEA, marginTop: 6, textAlign: "center", paddingHorizontal: 60 }}>{portada.subtitulo}</Text>}
          </View>
          <Text style={{ fontSize: 8, letterSpacing: 1, textAlign: "center", marginBottom: 40 }}>NORESTE ARQ</Text>
        </Page>
      )}

      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerTexto}>{fecha}</Text>
            <Text style={s.headerTexto}>{membrete.instagram}</Text>
            <Text style={s.headerTexto}>{membrete.email}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={`${base}/images/marca/logo.png`} style={{ width: 96 }} />
        </View>
        {cuerpo.map((b, i) => (
          <BloquePdf key={i} b={b} />
        ))}
        <View style={s.footer} fixed>
          <View>
            {membrete.telefonos.map((t, i) => (
              <Text key={i}>
                {t.numero} | {t.nombre}
              </Text>
            ))}
          </View>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber - (portada ? 1 : 0)} / ${totalPages - (portada ? 1 : 0) - (contratapa ? 1 : 0)}`} />
        </View>
      </Page>

      {contratapa && (
        <Page size="A4" style={s.negra}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>muchas gracias!</Text>
            <Text style={{ fontSize: 9, marginTop: 4 }}>{membrete.email}</Text>
          </View>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={`${base}/images/marca/isotipo-blanco.png`} style={{ width: 34 }} />
          </View>
        </Page>
      )}
    </Document>
  );
}
