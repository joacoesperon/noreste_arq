import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../admin/admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Modelo 3D · noreste arq",
  robots: { index: false, follow: false },
  icons: { icon: "/images/favicon.png" },
};

// Root layout de la vista pública del visor (links para clientes).
export default function VisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
