import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../admin/admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tu obra · noreste arq",
  robots: { index: false, follow: false },
  icons: { icon: "/images/favicon.png" },
};

// Root layout del portal del cliente (links que el estudio comparte desde la ficha de la obra).
export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
