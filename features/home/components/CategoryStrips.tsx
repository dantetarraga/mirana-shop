export function CategoryStrips() {
  const cats = [
    { label: "Figuras de Acción", sub: "Marvel, DC, Anime, Sci-Fi", cls: "stripe-fig", href: "/catalogo?cat=figures" },
    { label: "Sets LEGO", sub: "Technic, Star Wars, Architecture", cls: "stripe-lego", href: "/catalogo?cat=lego" },
    { label: "Vehículos Escala", sub: "Hot Wheels, Burago, Maisto", cls: "stripe-veh", href: "/catalogo?cat=vehicles" },
  ];
  return (
    <section className="px-12 pb-20 grid grid-cols-3 gap-4">
      {cats.map((c) => (
        <a key={c.label} href={c.href} className="no-underline cursor-pointer block">
          <div className={`${c.cls} h-[180px] flex items-end px-6 pb-6 relative border border-[var(--bd)] transition-[border-color] duration-[.25s]`}>
            <div>
              <div className="font-display text-[28px] font-black uppercase tracking-[-0.5px] text-text leading-none">{c.label}</div>
              <div className="text-[12px] text-muted mt-1">{c.sub}</div>
            </div>
            <div className="absolute top-5 right-5 font-display text-[13px] font-bold text-[var(--gold)] tracking-[1px] uppercase">Ver →</div>
          </div>
        </a>
      ))}
    </section>
  );
}
