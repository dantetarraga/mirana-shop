import { cn } from "@/lib/utils";

export function StockBadge({ s }: { s: number }) {
  const cls  = s === 0 ? "stock-out" : s <= 8 ? "stock-low" : "stock-ok";
  const text = s === 0 ? "● Agotado" : s <= 8 ? `● ${s} · Bajo` : `● ${s}`;
  return (
    <span className={cn("font-display font-extrabold text-[14px] inline-flex items-center gap-1.5 px-[10px] py-[3px] border", cls)}>
      {text}
    </span>
  );
}
