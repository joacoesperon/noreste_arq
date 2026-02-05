"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

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
        <a href="/" className="header-title" data-title="NORESTE ARCH">
          noreste arch
        </a>

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
            <li className={pathname === "/index" ? "current-menu-item" : ""}>
              <a href="/index">Index</a>
            </li>
          </ul>

          <ul className="menu menu-right list-unstyled">
            <li className={pathname === "/info" ? "current-menu-item" : ""}>
              <a href="/info">Info</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
