"use client";

import { PRODUCTS } from "@/shared/data/products";
import { ProductCard } from "@/components/shared/ProductCard";

export function NewArrivals() {
  const items = PRODUCTS.filter((p) => p.isNew).slice(0, 6);

  return (
    <section className="px-12 py-[80px]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-[10px] text-[var(--gold)]">
            Recién llegados
          </div>
          <h2
            className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]"
          >
            Novedades
          </h2>
        </div>
        <a
          href="/catalogo"
          className="font-display text-[15px] font-bold tracking-[1px] uppercase no-underline border-b border-transparent pb-0.5 text-muted"
        >
          Ver todos →
        </a>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none]">
        {items.map((p) => (
          <div key={p.id} className="shrink-0 w-[260px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
