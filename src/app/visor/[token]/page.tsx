import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { VisorIfc } from "@/components/visor/visor-ifc";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

const venceFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function VisorPublicoPage({ params }: Props) {
  const { token } = await params;
  // Cliente anónimo: el único acceso es la función visor_compartido, que valida token y vencimiento.
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase.rpc("visor_compartido", { p_token: token });
  const modelo = data?.[0];

  return (
    <div className="flex h-svh flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/images/favicon.png" alt="noreste arq" width={32} height={32} className="size-8 rounded-md" />
          <div>
            <p className="font-semibold">{modelo?.obra ?? "noreste arq"}</p>
            {modelo && <p className="text-xs text-muted-foreground">{modelo.nombre}</p>}
          </div>
        </div>
        {modelo && (
          <p className="text-xs text-muted-foreground">Disponible hasta el {venceFormat.format(new Date(modelo.expires_at))}</p>
        )}
      </header>
      <main className="min-h-0 flex-1">
        {modelo ? (
          <VisorIfc url={modelo.signed_url} nombre={modelo.nombre} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border p-6 text-center">
            <div>
              <p className="font-medium">Este link no está disponible</p>
              <p className="text-sm text-muted-foreground">Puede haber vencido. Pedile uno nuevo al estudio.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
