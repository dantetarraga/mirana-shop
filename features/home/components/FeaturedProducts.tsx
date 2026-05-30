"use client";

import { useStore } from "@/lib/store-context";
import { PRODUCTS, CAT_LABELS, CAT_STRIPE } from "@/shared/data/products";
import { Button } from "@/components/ui/Button";

function Stars({ r }: { r: number }) {
  return <span style={{ color: "var(--gold)" }}>{"★".repeat(Math.floor(r))}{"☆".repeat(5 - Math.floor(r))}</span>;
}

export function FeaturedProducts() {
  const { openProductModal, addToCart } = useStore();
  const items = PRODUCTS.slice(0, 8);

  return (
    <section style={{ padding: "80px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>Selección premium</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: .95 }}>Favoritos del<br />momento</h2>
        </div>
        <a href="/catalogo" style={{ background: "none", border: "none", color: "var(--mt)", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>Ver catálogo →</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {items.map((p) => (
          <div key={p.id} className="pcard animate-fade-up" onClick={() => openProductModal(p)}>
            <div style={{ position: "relative" }}>
              <div className={CAT_STRIPE[p.cat]} style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "var(--mt)", textTransform: "uppercase" }}>{CAT_LABELS[p.cat]}</span>
              </div>
              {p.badge && <div style={{ position: "absolute", top: 12, left: 0, background: "var(--gold)", color: "#000", fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: "5px 10px" }}>{p.badge}</div>}
            </div>
            <div style={{ padding: "16px 16px 14px" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 5 }}>{CAT_LABELS[p.cat]}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, marginBottom: 12, letterSpacing: "-.5px" }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "var(--gold)" }}>${p.price.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "var(--mt)" }}><Stars r={p.rating} /> <span>({p.reviews})</span></div>
              </div>
              <Button variant="accent" size="md" className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(p, 1); }}>+ Agregar al carrito</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
