"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        {/* Logo centrado */}
        <Link href="/" className="header-title" data-title="NORESTE ARCH">
          noreste arch
        </Link>

        {/* Menú hamburguesa (móvil) */}
        <div 
          className={`nav-menu ${menuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span className="menu-line"></span>
          <span className="menu-line"></span>
          <span className="menu-line"></span>
        </div>

        {/* Navigation */}
        <nav className={`navigation ${menuOpen ? 'active' : ''}`}>
          <ul className="menu menu-left list-unstyled">
            <li className={pathname === "/indice" ? "current-menu-item" : ""}>
              <Link href="/indice">Index</Link>
            </li>
          </ul>

          <ul className="menu menu-right list-unstyled">
            <li className={pathname === "/info" ? "current-menu-item" : ""}>
              <Link href="/info">Info</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
