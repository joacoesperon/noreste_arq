import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./admin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "panel · noreste arq",
    template: "%s · panel noreste arq",
  },
  robots: { index: false, follow: false },
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

// Root layout propio del panel: no comparte CSS con el sitio público.
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-svh antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
