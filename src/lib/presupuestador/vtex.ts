import "server-only";

// Catálogo público de tiendas VTEX (Easy, Prestigio y otras): búsqueda y precio por producto.
// Se identifica con User-Agent y se consulta poco (búsquedas a mano y un cron semanal).
// Solo se consultan dominios cargados en un proveedor: nunca una URL que venga del navegador.

const UA = "noreste-arq-panel/1.0 (+https://www.norestearq.com)";

export type ProductoWeb = {
  producto_id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
  url: string | null;
  imagen: string | null;
};

export function dominioValido(dominio: string | null | undefined): dominio is string {
  return !!dominio && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(dominio);
}

type VtexProducto = {
  productId: string;
  productName: string;
  link?: string;
  items?: { images?: { imageUrl: string }[]; sellers?: { commertialOffer?: { Price?: number; AvailableQuantity?: number } }[] }[];
};

function mapear(p: VtexProducto): ProductoWeb | null {
  const oferta = p.items?.[0]?.sellers?.[0]?.commertialOffer;
  const precio = oferta?.Price ?? 0;
  if (!precio) return null;
  return {
    producto_id: String(p.productId),
    nombre: p.productName,
    precio,
    disponible: (oferta?.AvailableQuantity ?? 0) > 0,
    url: p.link ?? null,
    imagen: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
  };
}

async function consultar(dominio: string, query: string): Promise<VtexProducto[]> {
  if (!dominioValido(dominio)) throw new Error("Dominio inválido");
  const res = await fetch(`https://${dominio}/api/catalog_system/pub/products/search?${query}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`La tienda respondió ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Respuesta inesperada de la tienda");
  return data;
}

export async function buscarVtex(dominio: string, texto: string, limite = 8): Promise<ProductoWeb[]> {
  const data = await consultar(dominio, `ft=${encodeURIComponent(texto)}&_from=0&_to=${limite - 1}`);
  return data.map(mapear).filter((p): p is ProductoWeb => p !== null);
}

export async function precioVtex(dominio: string, productoId: string): Promise<ProductoWeb | null> {
  if (!/^\w+$/.test(productoId)) return null;
  const data = await consultar(dominio, `fq=productId:${productoId}`);
  return data[0] ? mapear(data[0]) : null;
}
