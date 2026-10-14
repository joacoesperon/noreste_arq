"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/admin/presupuestador", label: "Presupuestos" },
  { href: "/admin/presupuestador/materiales", label: "Materiales" },
  { href: "/admin/presupuestador/proveedores", label: "Proveedores" },
  { href: "/admin/presupuestador/precios", label: "Listas de precios" },
  { href: "/admin/presupuestador/cac", label: "Índice CAC" },
];

export function NavPresupuestador() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {SECCIONES.map((s) => {
        const activa = s.href === "/admin/presupuestador" ? pathname === s.href : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm",
              activa ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
