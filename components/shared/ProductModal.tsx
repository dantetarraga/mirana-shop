"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store-context";
import { CAT_LABELS, CAT_STRIPE } from "@/shared/data/products";
import { Button } from "@/components/ui/Button";

function Stars({ r }: { r: number }) {
  return (
    <span style={{ color: "var(--gold)" }}>
      {"★".repeat(Math.floor(r))}{"☆".repeat(5 - Math.floor(r))}
    </span>
  );
}

export function ProductModal() {
  const { activeProduct: p, closeProductModal, addToCart } = useStore();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeProductModal(); };
    if (p) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [p, closeProductModal]);

  if (!p) return null;

  return (
    <div onClick={closeProductModal} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.82)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surf)", border: "1px solid var(--bd)",
        maxWidth: 880, width: "100%", maxHeight: "92vh", overflowY: "auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        position: "relative",
      }}>
        {/* Image */}
        <div className={CAT_STRIPE[p.cat]} style={{
          minHeight: 440, display: "flex", alignItems: "center",
          justifyContent: "center", position: "relative",
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 2, color: "var(--mt)", textTransform: "uppercase" }}>
            {p.name.toUpperCase()}
          </div>
          <Button
            variant="icon"
            size="md"
            onClick={closeProductModal}
            style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
          >×</Button>
          {p.badge && (
            <div style={{
              position: "absolute", top: 16, left: 0,
              background: "var(--gold)", color: "#000",
              fontSize: 9, fontWeight: 800, letterSpacing: 2,
              textTransform: "uppercase", padding: "5px 10px",
            }}>
              {p.badge}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: 44, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "var(--mt)" }}>
              {CAT_LABELS[p.cat]}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,48px)",
              fontWeight: 900, textTransform: "uppercase", lineHeight: .95, letterSpacing: -1,
            }}>
              {p.name}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--mt)" }}>
            <Stars r={p.rating} /> <span>{p.rating} · {p.reviews} reseñas</span>
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>
            ${p.price.toFixed(2)}
          </div>

          <p style={{ color: "var(--mt)", lineHeight: 1.75, fontSize: 14, borderTop: "1px solid var(--bd)", paddingTop: 18 }}>
            {p.desc}
          </p>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 10 }}>Cantidad</div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--bd)", width: "fit-content" }}>
              <Button variant="icon" size="md" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</Button>
              <div style={{ width: 52, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, borderLeft: "1px solid var(--bd)", borderRight: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", height: 42 }}>{qty}</div>
              <Button variant="icon" size="md" onClick={() => setQty((q) => q + 1)}>+</Button>
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            full
            onClick={() => { addToCart(p, qty); closeProductModal(); }}
          >
            Agregar al carrito · ${(p.price * qty).toFixed(2)}
          </Button>

          <Button
            variant="outline"
            size="lg"
            full
            onClick={closeProductModal}
          >
            Seguir explorando
          </Button>
        </div>
      </div>
    </div>
  );
}
