/**
 * Helpers de media client-safe (sin SDK de Node ni secrets).
 * Se pueden importar desde componentes "use client" sin filtrar nada al bundle.
 */

/**
 * Optimiza una URL de video de Cloudinary insertando transformaciones de
 * calidad y tamaño. Reduce drásticamente el peso (causa de que los videos no
 * carguen en redes móviles) manteniendo el códec H.264 original.
 *
 * - `q_auto`     → calidad automática (gran ahorro de peso).
 * - `w_<width>`  → downscale al ancho indicado (opcional).
 *
 * IMPORTANTE: a propósito NO usamos `f_auto` ni `vc_auto`. Con ellos, Cloudinary
 * "mejora" el video a HEVC/H.265 para Safari, que iPhones viejos (ej. iPhone 11)
 * no reproducen de forma confiable. Sin esas flags el video queda en H.264/MP4,
 * que es universalmente compatible en todos los dispositivos.
 *
 * Passthrough seguro: si la URL no es un video de Cloudinary o ya trae una
 * transformación, la devuelve sin tocar.
 *
 * @param url   URL completa del video.
 * @param width Ancho máximo opcional (px). Omitir para mantener la resolución original.
 */
export function optimizeCloudinaryVideo(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return url;
  }

  const [prefix, rest] = url.split("/video/upload/");

  // Si el primer segmento ya es una transformación (f_, q_, w_, c_, vc_, e_...),
  // no la duplicamos.
  const firstSegment = rest.split("/")[0];
  if (/(^|,)(f_|q_|w_|h_|c_|vc_|e_|ac_)/.test(firstSegment)) {
    return url;
  }

  const transforms = ["q_auto"];
  if (width) transforms.push(`w_${width}`);

  return `${prefix}/video/upload/${transforms.join(",")}/${rest}`;
}

/**
 * Genera la URL de un póster (primer frame) a partir de una URL de video de
 * Cloudinary. Se usa como `poster` del <video> para mostrar algo al instante
 * mientras el video todavía no se descargó/reprodujo: evita el "recuadro en
 * blanco" al scrollear en mobile.
 *
 * - `so_0`   → frame en el segundo 0 (primer cuadro).
 * - `.jpg`   → se entrega como imagen (f_auto puede servir WebP).
 *
 * Devuelve "" si la URL no es un video de Cloudinary.
 *
 * @param url   URL completa del video.
 * @param width Ancho del póster (px). Opcional.
 */
export function cloudinaryVideoPoster(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return "";
  }

  const [prefix, rest] = url.split("/video/upload/");
  const segments = rest.split("/");

  // Descartar una transformación previa si existiera (primer segmento).
  if (/(^|,)(f_|q_|w_|h_|c_|vc_|e_|so_|ac_)/.test(segments[0])) {
    segments.shift();
  }

  // El frame se entrega como imagen → cambiar la extensión a .jpg
  const path = segments.join("/").replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");

  const transforms = ["so_0", "f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`);

  return `${prefix}/video/upload/${transforms.join(",")}/${path}`;
}
