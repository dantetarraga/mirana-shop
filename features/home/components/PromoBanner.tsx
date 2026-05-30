export function PromoBanner() {
  const items = ["Envío gratis en pedidos +$75", "Figuras exclusivas de importación", "Preventas con adelanto del 50%", "Más de 500 productos", "Pago seguro con Culqi", "Devoluciones en 30 días"];
  const doubled = [...items, ...items];
  return (
    <div className="bg-[var(--gold)] text-black py-[11px] overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-display text-[13px] font-bold tracking-[2.5px] uppercase px-7 inline-flex items-center gap-[14px]">
            {item} <span className="opacity-35 text-[9px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
