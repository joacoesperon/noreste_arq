import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import { ESTUDIO } from "@/lib/documentos/estudio";
import { etiquetaMes, rangoMeses } from "@/lib/cronogramas/rango";

// PDF con fuentes estándar (Helvetica) hasta confirmar la licencia de Neue Haas Grotesk
// para documentos generados (alcance, decisión T3).

const NEGRO = "#171717";
const GRIS = "#737373";
const LINEA = "#d4d4d4";
const AMBAR = "#f59e0b";

const s = StyleSheet.create({
  page: { paddingTop: 72, paddingBottom: 64, paddingHorizontal: 60, fontFamily: "Helvetica", fontSize: 10, color: NEGRO, lineHeight: 1.45 },
  header: { position: "absolute", top: 28, left: 60, right: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 0.5, borderBottomColor: LINEA, paddingBottom: 6 },
  footer: { position: "absolute", bottom: 28, left: 60, right: 60, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: LINEA, paddingTop: 6, fontSize: 7.5, color: GRIS },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 6 },
  h2: { fontSize: 11.5, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 4 },
  h3: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 3 },
  p: { marginBottom: 5, minHeight: 6 },
  li: { flexDirection: "row", marginBottom: 3 },
  liMarca: { width: 14 },
  tabla: { marginVertical: 6 },
  fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINEA, paddingVertical: 3 },
  celda: { flex: 1, paddingHorizontal: 2 },
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
          <View key={i} style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eeeeee", minHeight: 16 }}>
            <Text style={{ width: "32%", fontSize: 7.5, paddingVertical: 3, paddingRight: 4 }}>
              {e.nombre}
              {e.clave ? " •" : ""}
            </Text>
            <View style={{ width: "68%", position: "relative" }}>
              {r.meses.map((m) => (
                <View key={m} style={{ position: "absolute", left: `${r.pos(m)}%`, top: 0, bottom: 0, borderLeftWidth: 0.4, borderLeftColor: "#e5e5e5" }} />
              ))}
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  height: 8,
                  left: `${r.pos(e.inicio)}%`,
                  width: hito ? 6 : `${Math.max(r.ancho(e), 0.8)}%`,
                  backgroundColor: e.clave || hito ? AMBAR : "#404040",
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
        <View style={s.tabla}>
          <View style={[s.fila, { borderBottomWidth: 1, borderBottomColor: NEGRO }]}>
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
                f.tipo === "seccion" ? { backgroundColor: "#f5f5f5" } : {},
                f.tipo === "total" ? { borderTopWidth: 1, borderTopColor: NEGRO, borderBottomWidth: 0 } : {},
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
                      color: f.tipo === "subtotal" ? GRIS : NEGRO,
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
    case "gantt":
      return <GanttPdf etapas={b.etapas} />;
    case "firmas":
      return (
        <View style={{ flexDirection: "row", gap: 40, marginTop: 60 }} wrap={false}>
          {b.partes.map((p, i) => (
            <View key={i} style={{ flex: 1, borderTopWidth: 0.8, borderTopColor: NEGRO, paddingTop: 4, alignItems: "center" }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.nombre}</Text>
              <Text style={{ fontSize: 8, color: GRIS }}>{p.rol}</Text>
            </View>
          ))}
        </View>
      );
    case "separador":
      return <View style={{ borderBottomWidth: 0.5, borderBottomColor: LINEA, marginVertical: 8 }} />;
  }
}

// Marca en texto hasta recibir el logo en vector (el PNG actual tiene fondo).
function Marca() {
  return (
    <View>
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, lineHeight: 0.95, letterSpacing: -0.3 }}>noreste</Text>
      <Text style={{ fontFamily: "Helvetica", fontSize: 7, letterSpacing: 0.5 }}>ARQ</Text>
    </View>
  );
}

export function DocumentoPdf({ documento }: { documento: DocumentoResuelto }) {
  return (
    <Document title={documento.titulo} author={ESTUDIO.nombre} creator="Panel noreste arq">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Marca />
          <Text style={{ fontSize: 7.5, color: GRIS }}>{ESTUDIO.nombre.toUpperCase()}</Text>
        </View>
        {documento.bloques.map((b, i) => (
          <BloquePdf key={i} b={b} />
        ))}
        <View style={s.footer} fixed>
          <Text>
            {ESTUDIO.nombre} · {ESTUDIO.email} · {ESTUDIO.telefono}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
