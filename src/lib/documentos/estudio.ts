// Datos del estudio para los documentos. Los valores reales (incluidos los DNI de los
// firmantes) se guardan en la tabla `estudio_config` y se editan desde Plantillas →
// Datos del estudio. Acá solo hay valores públicos por defecto: el repositorio es público.

export type FirmanteEstudio = { titulo: string; nombre: string; dni: string; /** Matrícula profesional (contrato CPAU) */ matricula?: string };
export type TelefonoEstudio = { numero: string; nombre: string };

export type DatosEstudio = {
  nombre: string;
  email: string;
  instagram: string;
  web: string;
  ciudad: string;
  /** Domicilio legal del estudio (contratos). */
  domicilio: string;
  firmantes: FirmanteEstudio[];
  telefonos: TelefonoEstudio[];
};

export const ESTUDIO_BASE: DatosEstudio = {
  nombre: "Noreste Arquitectura",
  email: "norestearquitectura@gmail.com",
  instagram: "@noreste.arq",
  web: "norestearq.com",
  ciudad: "Buenos Aires, Argentina",
  domicilio: "",
  firmantes: [
    { titulo: "Arq.", nombre: "Josefina Gardey", dni: "" },
    { titulo: "Arq.", nombre: "Juan Esperon", dni: "" },
  ],
  telefonos: [
    { numero: "+54 9 2478 51-1254", nombre: "Fefa Gardey" },
    { numero: "+54 9 11 5051-1959", nombre: "Juan Esperon" },
  ],
};

/** Datos guardados completados con los valores por defecto. */
export function datosEstudio(guardado: unknown): DatosEstudio {
  const g = (guardado ?? {}) as Partial<DatosEstudio>;
  return {
    ...ESTUDIO_BASE,
    ...Object.fromEntries(Object.entries(g).filter(([, v]) => v !== null && v !== undefined && v !== "")),
    firmantes: Array.isArray(g.firmantes) && g.firmantes.length ? g.firmantes : ESTUDIO_BASE.firmantes,
    telefonos: Array.isArray(g.telefonos) && g.telefonos.length ? g.telefonos : ESTUDIO_BASE.telefonos,
  };
}

/** "a, b y c" */
export function enumerar(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** DNI con puntos de miles: 12345678 → 12.345.678 */
function formatDni(dni: string) {
  const d = dni.replace(/\D/g, "");
  return d ? Number(d).toLocaleString("es-AR") : dni;
}

/** Valores {{estudio.*}} para las plantillas. "" = falta (se marca en el documento). */
export function valoresEstudio(e: DatosEstudio): Record<string, string> {
  const conDni = e.firmantes.every((f) => f.dni.trim());
  return {
    "estudio.nombre": e.nombre,
    "estudio.profesionales": enumerar(e.firmantes.map((f) => `${f.titulo} ${f.nombre}`.trim())),
    "estudio.firmantes": conDni ? enumerar(e.firmantes.map((f) => `${f.nombre}, D.N.I. ${formatDni(f.dni)}`)) : "",
    "estudio.firmantes_matricula":
      conDni && e.firmantes.every((f) => f.matricula?.trim())
        ? enumerar(e.firmantes.map((f) => `${f.titulo} ${f.nombre}, D.N.I. ${formatDni(f.dni)}, matrícula ${f.matricula!.trim()}`.trim()))
        : "",
    "estudio.domicilio": e.domicilio,
    "estudio.email": e.email,
    "estudio.instagram": e.instagram,
    "estudio.telefono": e.telefonos[0]?.numero ?? "",
    "estudio.telefonos": e.telefonos.map((t) => `${t.numero} (${t.nombre})`).join(" · "),
  };
}

/** Lo que va en el encabezado y el pie de cada página. */
export type Membrete = Pick<DatosEstudio, "nombre" | "email" | "instagram" | "telefonos">;

export function membreteDe(e: DatosEstudio): Membrete {
  return { nombre: e.nombre, email: e.email, instagram: e.instagram, telefonos: e.telefonos };
}
