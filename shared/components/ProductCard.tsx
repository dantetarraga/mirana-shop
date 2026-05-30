"use client";

import { useStore } from "@/shared/lib/store-context";
import type { Product } from "@/features/products/data/products";
import { CAT_LABELS, CAT_STRIPE } from "@/features/products/data/products";
import { Button } from "@/shared/components/ui/Button";

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

function Stars({ r }: { r: number }) {
  const full = Math.floor(r);
  return (
    <span className="text-[var(--gold)]">
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export function ProductCard({ product: p, showBadge = true }: ProductCardProps) {
  const { openProductModal, addToCart } = useStore();

  return (
    <div className="pcard animate-fade-up" onClick={() => openProductModal(p)}>
      <div className="relative">
        <div
          className={`${CAT_STRIPE[p.cat]} h-[220px] flex items-center justify-center`}
        >
          <span className="font-mono text-[10px] tracking-[2px] uppercase text-muted">
            {CAT_LABELS[p.cat]}
          </span>
        </div>
        {showBadge && p.badge && (
          <div
            className="absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-[5px] bg-[var(--gold)] text-black"
          >
            {p.badge}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-3.5">
        <div className="text-[10px] tracking-[2px] uppercase mb-[5px] text-muted">
          {CAT_LABELS[p.cat]}
        </div>
        <div className="font-display text-[21px] font-black uppercase leading-[1.05] mb-3 tracking-[-0.5px]">
          {p.name}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-display text-[26px] font-black text-[var(--gold)]">
            ${p.price.toFixed(2)}
          </div>
          <div className="text-[11px] text-muted">
            <Stars r={p.rating} />
            <span className="ml-1">({p.reviews})</span>
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
