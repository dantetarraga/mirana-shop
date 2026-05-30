"use client";

import { useState } from "react";
import { PRODUCTS } from "@/shared/data/products";
import { type Product } from "@/shared/data/products";
import { ORDERS_DATA, USERS_DATA } from "@/features/admin/dashboard/lib/admin-data";
import { type Module } from "@/features/admin/dashboard/lib/admin-constants";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Bell, Calendar, LayoutDashboard, ShoppingCart, Package, Archive, Image, Users } from "lucide-react";
import { DashboardModule } from "./modules/DashboardModule";
import { OrdersModule } from "./modules/OrdersModule";
import { ProductsModule } from "./modules/ProductsModule";
import { InventoryModule } from "./modules/InventoryModule";
import { BannersModule } from "./modules/BannersModule";
import { UsersModule } from "./modules/UsersModule";

const NAV_ITEMS = [
  { section: "Principal" },
  { k: "dashboard" as Module, label: "Resumen",    icon: LayoutDashboard },
  { k: "orders"    as Module, label: "Pedidos",    icon: ShoppingCart },
  { section: "Catálogo" },
  { k: "products"  as Module, label: "Productos",  icon: Package },
  { k: "inventory" as Module, label: "Inventario", icon: Archive },
  { k: "banners"   as Module, label: "Banners",    icon: Image },
  { section: "Clientes" },
  { k: "users"     as Module, label: "Usuarios",   icon: Users },
];

const TITLES: Record<Module, [string, string]> = {
  dashboard: ["Resumen general",  "Vista de rendimiento de la tienda"],
  orders:    ["Pedidos",          "Gestión de órdenes y envíos"],
  products:  ["Productos",        "Catálogo y fichas de producto"],
  inventory: ["Inventario",       "Control de stock y reabastecimiento"],
  banners:   ["Banners",          "Campañas y promociones visuales"],
  users:     ["Usuarios",         "Base de clientes y segmentación"],
};

export default function AdminDashboard() {
  const [page, setPage] = useState<Module>("dashboard");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState(ORDERS_DATA);

  const saveProduct = (p: Product) =>
    setProducts(ps => ps.some(x => x.id === p.id) ? ps.map(x => x.id === p.id ? { ...x, ...p } : x) : [...ps, p]);
  const deleteProduct = (id: number) => setProducts(ps => ps.filter(p => p.id !== id));
  const setOrderStatus = (id: string, st: string) => setOrders(os => os.map(o => o.id === id ? { ...o, status: st } : o));
  const counts: Partial<Record<Module, number>> = { orders: orders.length, products: products.length, users: USERS_DATA.length };
  const [t1, t2] = TITLES[page];

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
          {NAV_ITEMS.map((n, i) => "section" in n && !("k" in n) ? (
            <div key={i} style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", padding: "14px 12px 8px" }}>{n.section}</div>
          ) : "k" in n ? (
            <Button key={n.k} variant="ghost" size="sm" full active={page === n.k} onClick={() => setPage(n.k!)} className="justify-start gap-[12px] px-[12px] relative">
              {page === n.k && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, background: "var(--gold)" }} />}
              {"icon" in n && n.icon && <n.icon size={17} style={{ flexShrink: 0 }} />}
              {n.label}
              {counts[n.k!] != null && (
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, background: page === n.k ? "var(--gold)" : "var(--card-h)", padding: "1px 8px", color: page === n.k ? "#000" : "var(--mt)" }}>
                  {counts[n.k!]}
                </span>
              )}
            </Button>
          ) : null)}
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

        {/* Module switch */}
        {page === "dashboard"  && <DashboardModule products={products} orders={orders} onGoto={setPage} />}
        {page === "orders"     && <OrdersModule orders={orders} onStatus={setOrderStatus} />}
        {page === "products"   && <ProductsModule products={products} onSave={saveProduct} onDelete={deleteProduct} />}
        {page === "inventory"  && <InventoryModule products={products} onSave={saveProduct} />}
        {page === "banners"    && <BannersModule />}
        {page === "users"      && <UsersModule />}
      </main>
    </div>
  );
}
