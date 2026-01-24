import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "noreste arq - Estudio de arquitectura y diseño",
  description: "Estudio de arquitectura y diseño con base en Punta del Este.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <div id="pageloader" className="hide"></div>
      </body>
    </html>
  );
}
