import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import "@ncdai/react-wheel-picker/style.css";
import AccessibilityMenu from "@/components/AccessibilityMenu";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "noreste arq - Estudio de arquitectura y diseño",
  description: "Estudio de arquitectura y diseño con base en Buenos Aires.",
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/eml1xpb.css" />
      </head>
      <body className={`${inter.variable} ${lexend.variable} font-sans`}>
        {children}
        <AccessibilityMenu />
        <div id="pageloader" className="hide"></div>
      </body>
    </html>
  );
}
