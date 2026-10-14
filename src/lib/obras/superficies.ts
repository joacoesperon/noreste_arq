export type Superficies = {
  sup_cubierta: number | null;
  sup_semicubierta: number | null;
  sup_descubierta: number | null;
};

export type TotalesSuperficie = {
  cubierta: number;
  semicubierta: number;
  descubierta: number;
  total: number;
};

/**
 * Si la obra tiene sectores, el total es la suma de los sectores;
 * si no, se usan las superficies cargadas en la obra.
 */
export function totalesSuperficie(obra: Superficies, sectores: Superficies[] = []): TotalesSuperficie {
  const fuentes = sectores.length > 0 ? sectores : [obra];
  const sum = (key: keyof Superficies) => fuentes.reduce((acc, s) => acc + Number(s[key] ?? 0), 0);

  const cubierta = sum("sup_cubierta");
  const semicubierta = sum("sup_semicubierta");
  const descubierta = sum("sup_descubierta");
  return { cubierta, semicubierta, descubierta, total: cubierta + semicubierta + descubierta };
}

const m2Format = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export function formatM2(value: number) {
  return `${m2Format.format(value)} m²`;
}
