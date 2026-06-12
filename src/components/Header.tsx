"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="flex items-center fixed top-0 left-0 w-full min-h-15 md:min-h-19.5 z-999 bg-transparent transition-all duration-300">
      <div className="mx-auto px-4 md:px-8 max-w-400 flex items-center justify-between relative h-full w-full">
        
        {/* Navigation - Siempre visible */}
        <nav className="flex items-center justify-between w-full h-full">
          
          {/* Menu Izquierdo - Index */}
          <div className="flex justify-start w-[25%] md:w-[35%]">
            <Link 
              href="/indice" 
              className={`text-text hover:text-text-hover text-title lowercase transition-all duration-300 relative py-2 block after:content-[''] after:block after:border-b after:border-text after:h-px after:transition-transform after:duration-300 after:origin-left hover:after:scale-x-100 ${pathname === "/indice" ? 'after:scale-x-100' : 'after:scale-x-0'}`}
            >
              index
            </Link>
          </div>

          {/* Header Title - Siempre centrado */}
          <Link
            href="/"
            className={`header-title absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-text text-title lowercase tracking-normal font-sans z-22 transition-all duration-350 hover:text-text-hover group ${pathname === "/" ? "home-hidden" : ""}`}
          >
            noreste arq
            <span className="block border-b border-text h-px w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right group-hover:origin-left"></span>
          </Link>

          {/* Menu Derecho - Info */}
          <div className="flex justify-end w-[25%] md:w-[35%]">
            <Link 
              href="/info" 
              className={`text-text hover:text-text-hover text-title lowercase transition-all duration-300 relative py-2 block after:content-[''] after:block after:border-b after:border-text after:h-px after:transition-transform after:duration-300 after:origin-left hover:after:scale-x-100 ${pathname === "/info" ? 'after:scale-x-100' : 'after:scale-x-0'}`}
            >
              info
            </Link>
          </div>

        </nav>
      </div>
    </header>
  );
}