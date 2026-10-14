/** Texto normalizado para comparar descripciones de proveedores: minúsculas, sin acentos ni espacios dobles. */
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.,/x×%+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
