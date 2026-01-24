"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [lang, setLang] = useState<"ES" | "EN">("ES");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-bone">
      {/* Logo - usa <a> para forzar recarga completa y resetear GSAP */}
      <a 
        href="/" 
        className="text-lg font-medium tracking-tight text-carbon hover:text-concrete transition-colors"
      >
        noreste_arq
      </a>

      {/* Navegación + Idioma */}
      <nav className="flex items-center gap-6">
        <a 
          href="/index" 
          className={`text-lg text-carbon hover:text-concrete transition-colors ${pathname === "/index" ? "underline" : ""}`}
          aria-current={pathname === "/index" ? "page" : undefined}
        >
          {lang === "ES" ? "índice" : "index"}
        </a>
        <a 
          href="/info" 
          className={`text-lg text-carbon hover:text-concrete transition-colors ${pathname === "/info" ? "underline" : ""}`}
          aria-current={pathname === "/info" ? "page" : undefined}
        >
          info
        </a>
        
        {/* Selector de idioma sutil */}
        <button
          onClick={() => setLang(lang === "ES" ? "EN" : "ES")}
          className="text-lg text-concrete hover:text-carbon transition-colors ml-2 cursor-pointer"
          aria-label="Cambiar idioma"
        >
          {lang}
        </button>
      </nav>
    </header>
  );
}
