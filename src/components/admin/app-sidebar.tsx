"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  ChevronsUpDown,
  FileText,
  Globe,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/admin/actions";
import type { StaffUser } from "@/lib/auth";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  icon: LucideIcon;
  /** Sin href: sección planificada que todavía no está disponible. */
  href?: string;
  badge?: number;
};

const estudio = (paraRevisar: number): NavItem[] => [
  { title: "Tablero", href: "/admin", icon: LayoutDashboard, badge: paraRevisar },
  { title: "Obras", href: "/admin/obras", icon: Building2 },
  { title: "Documentos", href: "/admin/documentos", icon: FileText },
  { title: "Presupuestador", icon: Calculator },
  { title: "Plantillas", href: "/admin/plantillas", icon: LayoutTemplate },
];

const web: NavItem[] = [{ title: "Sitio web", href: "/admin/sitio-web", icon: Globe }];

function initials(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : !!item.href && pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.title}>
                {item.href ? (
                  <>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!item.badge && (
                      <SidebarMenuBadge title={`${item.badge} para revisar`}>
                        <Badge className="h-5 min-w-5 px-1.5">{item.badge}</Badge>
                      </SidebarMenuBadge>
                    )}
                  </>
                ) : (
                  <>
                    <SidebarMenuButton disabled tooltip={`${item.title} (próximamente)`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                        pronto
                      </Badge>
                    </SidebarMenuBadge>
                  </>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ staff, paraRevisar }: { staff: StaffUser; paraRevisar: number }) {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <Image src="/images/favicon.png" alt="" width={32} height={32} className="size-8 rounded-md" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">noreste arq</span>
                  <span className="truncate text-xs text-muted-foreground">panel del estudio</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Estudio" items={estudio(paraRevisar)} />
        <NavGroup label="Web" items={web} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md">{initials(staff.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{staff.nombre}</span>
                    <span className="truncate text-xs text-muted-foreground">@{staff.usuario}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="grid text-sm leading-tight">
                    <span className="font-medium">{staff.nombre}</span>
                    <span className="text-xs text-muted-foreground">{staff.rol}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
                  <KeyRound />
                  Cambiar contraseña
                </DropdownMenuItem>
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut />
                      Salir
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </Sidebar>
  );
}
