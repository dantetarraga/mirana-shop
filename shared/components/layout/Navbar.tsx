"use client";

import { Button } from "@/shared/components/ui/Button";
import { useStore } from "@/shared/lib/store-context";
import { LayoutGrid, LogOut, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Navbar() {
  const { cartCount, setCartOpen, user, openAuth, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-12 transition-[background] duration-300 h-[var(--nh)] bg-[rgba(3,4,9,.92)] backdrop-blur-[28px] border-b border-[var(--bd)]"
    >
      <Link
        href="/"
        className="font-display font-black text-[26px] tracking-[5px] no-underline uppercase text-text"
      >
        MIRA<span className="text-[var(--gold)]">NA</span>
      </Link>

      <ul className="flex gap-7 list-none">
        {[
          ["Inicio", "/"],
          ["Catálogo", "/catalogo"],
          ["Novedades", "/catalogo?cat=figures"],
          ["Preventas", "/catalogo?cat=preorder"],
        ].map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-[12px] font-semibold tracking-[1px] no-underline uppercase transition-[color] duration-200 pb-1 border-b border-transparent text-muted"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3.5 h-10 bg-surf border border-[var(--bd)]"
        >
          <Search size={13} className="shrink-0 text-muted" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none font-sans text-[13px] w-[140px] text-text"
          />
        </div>

        {/* Cart */}
        <Button
          variant="icon"
          size="md"
          onClick={() => setCartOpen(true)}
          className="relative"
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && (
            <span
              className="absolute top-[-6px] right-[-6px] w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold font-display bg-[var(--gold)] text-black"
            >
              {cartCount}
            </span>
          )}
        </Button>

        {/* User */}
        <div className="relative" ref={menuRef}>
          {user ? (
            <Button
              variant="accent"
              className="w-10 h-10 p-0"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {initials}
            </Button>
          ) : (
            <Button
              variant="accent"
              size="md"
              onClick={() => openAuth("login")}
            >
              Ingresar
            </Button>
          )}

          {/* Dropdown */}
          {menuOpen && user && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 min-w-[220px] z-[250] bg-surf border border-[var(--bd)] shadow-[0_16px_48px_rgba(0,0,0,.4)]"
            >
              <div className="px-4.5 py-4 border-b border-[var(--bd)]">
                <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.5px]">
                  {user.name}
                </div>
                <div className="text-[11px] mt-0.5 text-muted">{user.email}</div>
              </div>

              {[
                ["Mi perfil", "👤"],
                ["Mis pedidos", "📦"],
                ["Favoritos", "♡"],
              ].map(([label, icon]) => (
                <Button key={label} variant="ghost" size="sm" full className="justify-start px-4.5">
                  <span>{icon}</span> {label}
                </Button>
              ))}

              {/* Panel Admin — SOLO rol admin */}
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4.5 py-[11px] flex items-center gap-2.5 text-[13px] no-underline font-sans font-semibold text-[var(--gold)] border-t border-[var(--bd)]"
                >
                  <LayoutGrid size={14} />
                  Panel Admin
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                full
                onClick={() => { logout(); setMenuOpen(false); }}
                className="justify-start px-4.5 border-t border-[var(--bd)]"
              >
                <LogOut size={14} />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
