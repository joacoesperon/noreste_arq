/**
 * Helpers de media client-safe (sin SDK de Node ni secrets).
 * Se pueden importar desde componentes "use client" sin filtrar nada al bundle.
 */

/**
 * Optimiza una URL de video de Cloudinary insertando transformaciones de
 * formato/calidad/codec automáticos. Reduce drásticamente el peso, que es
 * la causa de que los videos no carguen en redes móviles.
 *
 * - `f_auto`  → mejor formato según el navegador.
 * - `q_auto`  → calidad automática.
 * - `vc_auto` → códec de video automático.
 * - `w_<width>` (opcional) → downscale al ancho indicado.
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

  const transforms = ["f_auto", "q_auto", "vc_auto"];
  if (width) transforms.push(`w_${width}`);

  return `${prefix}/video/upload/${transforms.join(",")}/${rest}`;
}
