/** Link de WhatsApp con el mensaje ya escrito. Normaliza números argentinos (agrega 54 9). */
export function linkWhatsapp(telefono: string | null | undefined, mensaje: string) {
  let n = (telefono ?? "").replace(/\D/g, "");
  if (!n) return null;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `549${n}`; // característica + número, sin código de país
  else if (n.startsWith("54") && !n.startsWith("549") && n.length === 12) n = `549${n.slice(2)}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajePedidoLista(proveedor: string, estudio: string) {
  return `Hola ${proveedor}, ¿cómo están? Somos ${estudio}. ¿Nos podrían enviar la lista de precios actualizada? ¡Gracias!`;
}
