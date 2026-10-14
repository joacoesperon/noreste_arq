// Categorías de la carpeta de cada obra (alcance-panel-estudio.pdf, módulo 03).
export const CATEGORIAS_ARCHIVO = [
  "Planos",
  "Modelos 3D",
  "Especialistas",
  "Contratos firmados",
  "Fotos",
  "Facturas",
  "Otros",
] as const;

export const BUCKET_ARCHIVOS = "obra-archivos";

/** Límite del bucket (plan gratis de Supabase). */
export const TAMANO_MAXIMO = 50 * 1024 * 1024;

export function formatTamano(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString("es-AR", { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`;
}

/** Nombre seguro para la ruta en Storage (sin acentos ni caracteres especiales). */
export function nombreSeguro(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return limpio.slice(-120) || "archivo";
}
