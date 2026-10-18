import Image from "next/image";
import { portalCompartido } from "@/lib/portal/datos";
import { PortalObra } from "@/components/portal/portal-obra";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

const venceFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function PortalClientePage({ params }: Props) {
  const { token } = await params;
  const portal = await portalCompartido(token);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/images/favicon.png" alt="noreste arq" width={32} height={32} className="size-8 rounded-md" />
          <div>
            <p className="font-semibold">{portal?.obra.titulo ?? "noreste arq"}</p>
            {portal && <p className="text-xs text-muted-foreground">Seguimiento de tu obra · noreste arq</p>}
          </div>
        </div>
        {portal?.expiresAt && (
          <p className="text-xs text-muted-foreground">Disponible hasta el {venceFormat.format(new Date(portal.expiresAt))}</p>
        )}
      </header>
      {portal ? (
        <PortalObra portal={portal} />
      ) : (
        <main className="flex flex-1 items-center justify-center rounded-lg border p-6 text-center">
          <div>
            <p className="font-medium">Este link no está disponible</p>
            <p className="text-sm text-muted-foreground">Puede haber vencido. Pedile uno nuevo al estudio.</p>
          </div>
        </main>
      )}
    </div>
  );
}
