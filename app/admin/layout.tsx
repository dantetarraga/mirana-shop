"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Bell,
  Calendar,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Archive,
  Image,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { section: "Principal" },
  { href: "/admin/dashboard", label: "Resumen",    icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Pedidos",    icon: ShoppingCart },
  { section: "Catálogo" },
  { href: "/admin/products",  label: "Productos",  icon: Package },
  { href: "/admin/inventory", label: "Inventario", icon: Archive },
  { href: "/admin/banners",   label: "Banners",    icon: Image },
  { section: "Clientes" },
  { href: "/admin/users",     label: "Usuarios",   icon: Users },
];

const TITLES: Record<string, [string, string]> = {
  "/admin/dashboard": ["Resumen general",  "Vista de rendimiento de la tienda"],
  "/admin/orders":    ["Pedidos",           "Gestión de órdenes y envíos"],
  "/admin/products":  ["Productos",         "Catálogo y fichas de producto"],
  "/admin/inventory": ["Inventario",        "Control de stock y reabastecimiento"],
  "/admin/banners":   ["Banners",           "Campañas y promociones visuales"],
  "/admin/users":     ["Usuarios",          "Base de clientes y segmentación"],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [t1, t2] = TITLES[pathname] ?? ["Admin", "Panel de administración"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 248, background: "var(--surf)", borderRight: "1px solid var(--bd)", position: "fixed", top: 0, bottom: 0, left: 0, display: "flex", flexDirection: "column", zIndex: 50 }}>
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26, letterSpacing: 4, textTransform: "uppercase" }}>
            MIRA<span style={{ color: "var(--gold)" }}>NA</span>
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", border: "1px solid var(--bd)", padding: "3px 7px", marginLeft: "auto" }}>Admin</span>
        </div>
        <nav style={{ flex: 1, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV_ITEMS.map((n, i) =>
            "section" in n && !("href" in n) ? (
              <div key={i} style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", padding: "14px 12px 8px" }}>{n.section}</div>
            ) : "href" in n ? (
              <Link key={n.href} href={n.href} style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm" full active={pathname === n.href} className="justify-start gap-[12px] px-[12px] relative">
                  {pathname === n.href && (
                    <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, background: "var(--gold)" }} />
                  )}
                  {"icon" in n && n.icon && <n.icon size={17} style={{ flexShrink: 0 }} />}
                  {n.label}
                </Button>
              </Link>
            ) : null
          )}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid var(--bd)" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", color: "var(--mt)", fontSize: 14, textDecoration: "none", fontFamily: "var(--font-sans)" }}>
            <ArrowLeft size={17} />
            Volver a la tienda
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
            <div style={{ width: 34, height: 34, background: "var(--gold)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>AD</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Admin Mirana</div>
              <div style={{ fontSize: 10, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: 248, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ height: 68, borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, background: "var(--bg)", zIndex: 40 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.5px", lineHeight: 1 }}>{t1}</div>
            <div style={{ fontSize: 11, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>{t2}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: "var(--mt)", border: "1px solid var(--bd)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={13} />
              May 2026
            </div>
            <Button variant="icon" size="md" style={{ position: "relative" }}>
              <Bell size={17} />
              <span style={{ position: "absolute", top: 8, right: 9, width: 6, height: 6, background: "var(--gold)", borderRadius: "50%" }} />
            </Button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
