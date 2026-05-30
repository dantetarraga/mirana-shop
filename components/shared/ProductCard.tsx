"use client";

import { useStore } from "@/lib/store-context";
import type { Product } from "@/shared/data/products";
import { CAT_LABELS, CAT_STRIPE } from "@/shared/data/products";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

function Stars({ r }: { r: number }) {
  const full = Math.floor(r);
  return (
    <span style={{ color: "var(--gold)" }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export function ProductCard({ product: p, showBadge = true }: ProductCardProps) {
  const { openProductModal, addToCart } = useStore();

  return (
    <div className="pcard animate-fade-up" onClick={() => openProductModal(p)}>
      <div style={{ position: "relative" }}>
        <div
          className={CAT_STRIPE[p.cat]}
          style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "var(--mt)", textTransform: "uppercase" }}>
            {CAT_LABELS[p.cat]}
          </span>
        </div>
        {showBadge && p.badge && (
          <div style={{
            position: "absolute", top: 12, left: 0,
            background: "var(--gold)", color: "#000",
            fontSize: 9, fontWeight: 800, letterSpacing: 2,
            textTransform: "uppercase", padding: "5px 10px",
          }}>
            {p.badge}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 5 }}>
          {CAT_LABELS[p.cat]}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, marginBottom: 12, letterSpacing: "-.5px" }}>
          {p.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "var(--gold)" }}>
            ${p.price.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>
            <Stars r={p.rating} />
            <span style={{ marginLeft: 4 }}>({p.reviews})</span>
          </div>
        </div>
        <Button
          variant="accent"
          size="md"
          className="add-btn"
          onClick={(e) => { e.stopPropagation(); addToCart(p, 1); }}
        >
          + Agregar al carrito
        </Button>
      </div>
    </div>
  );
}
