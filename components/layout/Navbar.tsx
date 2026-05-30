"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/Button";
import { Search, ShoppingBag, LayoutGrid } from "lucide-react";

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
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: "var(--nh)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px",
      background: "rgba(3,4,9,.92)",
      backdropFilter: "blur(28px)",
      borderBottom: "1px solid var(--bd)",
      transition: "background .3s",
    }}>
      <Link href="/" style={{
        fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26,
        letterSpacing: 5, color: "var(--text)", textDecoration: "none",
        textTransform: "uppercase",
      }}>
        MIRA<span style={{ color: "var(--gold)" }}>NA</span>
      </Link>

      <ul style={{ display: "flex", gap: 28, listStyle: "none" }}>
        {[
          ["Inicio", "/"],
          ["Catálogo", "/catalogo"],
          ["Novedades", "/catalogo?cat=figures"],
          ["Preventas", "/catalogo?cat=preorder"],
        ].map(([label, href]) => (
          <li key={label}>
            <Link href={href} style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 1,
              color: "var(--mt)", textDecoration: "none",
              textTransform: "uppercase", transition: ".2s",
              paddingBottom: 4, borderBottom: "1px solid transparent",
            }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--surf)", border: "1px solid var(--bd)",
          padding: "0 14px", height: 40,
        }}>
          <Search size={13} style={{ color: "var(--mt)", flexShrink: 0 }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Buscar..."
            style={{
              background: "none", border: "none", outline: "none",
              color: "var(--text)", fontFamily: "var(--font-sans)",
              fontSize: 13, width: 140,
            }}
          />
        </div>

        {/* Cart */}
        <Button
          variant="icon"
          size="md"
          onClick={() => setCartOpen(true)}
          style={{ position: "relative" }}
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "var(--gold)", color: "#000",
              width: 18, height: 18, borderRadius: "50%",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)",
            }}>
              {cartCount}
            </span>
          )}
        </Button>

        {/* User */}
        <div style={{ position: "relative" }} ref={menuRef}>
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
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--surf)", border: "1px solid var(--bd)",
              minWidth: 220, zIndex: 250,
              boxShadow: "0 16px 48px rgba(0,0,0,.4)",
            }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--bd)" }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: ".5px",
                }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 2 }}>{user.email}</div>
              </div>

              {[
                ["Mi perfil", "👤"],
                ["Mis pedidos", "📦"],
                ["Favoritos", "♡"],
              ].map(([label, icon]) => (
                <Button key={label} variant="ghost" size="sm" full className="justify-start px-[18px]">
                  <span>{icon}</span> {label}
                </Button>
              ))}

              {/* Panel Admin — SOLO rol admin */}
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "11px 18px", display: "flex", alignItems: "center",
                    gap: 10, fontSize: 13, color: "var(--gold)",
                    textDecoration: "none", fontFamily: "var(--font-sans)",
                    borderTop: "1px solid var(--bd)", fontWeight: 600,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
                  </svg>
                  Panel Admin
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                full
                onClick={() => { logout(); setMenuOpen(false); }}
                className="justify-start px-[18px] border-t border-[var(--bd)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
