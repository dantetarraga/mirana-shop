const BRANDS = [
  { name: "MARVEL",     sub: "LEGENDS SERIES" },
  { name: "LEGO®",      sub: "OFFICIAL PARTNER",     serif: true },
  { name: "BANDAI",     sub: "TAMASHII NATIONS" },
  { name: "HOT WHEELS", sub: "PREMIUM COLLECTION",   italic: true },
  { name: "HASBRO",     sub: "GLOBAL RETAILER" },
  { name: "McFARLANE",  sub: "TOYS",                 italic: true },
  { name: "FUNKO",      sub: "POP! AUTHORIZED",      mono: true },
  { name: "MATTEL",     sub: "CREATIONS",             serif: true },
  { name: "GOOD SMILE", sub: "NENDOROID" },
  { name: "KOTOBUKIYA", sub: "ARTFX SERIES",         mono: true },
];

export function BrandsCarousel() {
  const doubled = [...BRANDS, ...BRANDS];
  return (
    <section className="py-[60px] border-t border-[var(--bd)] border-b border-b-[var(--bd)] overflow-hidden">
      <div className="px-12 pb-8 flex justify-between items-baseline">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-[var(--gold)] mb-2.5">Marcas oficiales</div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(28px,3.5vw,42px)]">
            Distribuidor autorizado
          </h2>
        </div>
        <div className="text-[12px] text-muted tracking-[1px] uppercase">10+ marcas premium</div>
      </div>

      <div className="animate-marquee-slow flex gap-0">
        {doubled.map((b, i) => (
          <div key={i} className="brand-item shrink-0 w-[240px] h-[120px] flex items-center justify-center border-r border-[var(--bd)] px-8">
            <div className="text-center">
              <div
                className={`font-black uppercase tracking-[1px] leading-none text-text ${b.mono ? "font-mono text-[20px]" : "font-display text-[24px]"} ${b.italic ? "italic" : ""}`}
                style={b.serif ? { fontFamily: "Georgia,serif" } : undefined}
              >
                {b.name}
              </div>
              <div className="font-sans text-[9px] tracking-[3px] font-medium text-muted mt-1.5">
                {b.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
