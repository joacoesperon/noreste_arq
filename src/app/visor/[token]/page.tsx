import Image from "next/image";
import { BUCKET_ARCHIVOS } from "@/lib/archivos/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { VisorIfc } from "@/components/visor/visor-ifc";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

const venceFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Busca el link y genera un acceso de 1 hora al modelo. null si no existe, venció o fue revocado. */
async function modeloCompartido(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Visor público: falta SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  const { data: link } = await supabase
    .from("visor_links")
    .select("expires_at, archivo:archivos(nombre, storage_path, obra:obras(titulo))")
    .eq("token", token)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (!link?.archivo) return null;

  const { data: firmado } = await supabase.storage
    .from(BUCKET_ARCHIVOS)
    .createSignedUrl(link.archivo.storage_path, 60 * 60);
  if (!firmado) return null;

  return {
    nombre: link.archivo.nombre,
    obra: link.archivo.obra?.titulo ?? null,
    url: firmado.signedUrl,
    expiresAt: link.expires_at,
  };
}

export default async function VisorPublicoPage({ params }: Props) {
  const { token } = await params;
  const modelo = await modeloCompartido(token);

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
        {modelo?.expiresAt && (
          <p className="text-xs text-muted-foreground">Disponible hasta el {venceFormat.format(new Date(modelo.expiresAt))}</p>
        )}
      </header>
      <main className="min-h-0 flex-1">
        {modelo ? (
          <VisorIfc url={modelo.url} nombre={modelo.nombre} />
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
