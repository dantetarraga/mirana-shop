export function CategoryStrips() {
  const cats = [
    { label: "Figuras de Acción", sub: "Marvel, DC, Anime, Sci-Fi", cls: "stripe-fig", href: "/catalogo?cat=figures" },
    { label: "Sets LEGO", sub: "Technic, Star Wars, Architecture", cls: "stripe-lego", href: "/catalogo?cat=lego" },
    { label: "Vehículos Escala", sub: "Hot Wheels, Burago, Maisto", cls: "stripe-veh", href: "/catalogo?cat=vehicles" },
  ];
  return (
    <section style={{ padding: "0 48px 80px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      {cats.map((c) => (
        <a key={c.label} href={c.href} style={{ textDecoration: "none", cursor: "pointer", display: "block" }}>
          <div className={c.cls} style={{
            height: 180, display: "flex", alignItems: "flex-end",
            padding: "0 24px 24px", position: "relative",
            border: "1px solid var(--bd)", transition: ".25s",
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: -.5, color: "var(--text)", lineHeight: 1 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "var(--mt)", marginTop: 4 }}>{c.sub}</div>
            </div>
            <div style={{ position: "absolute", top: 20, right: 20, fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: 1, textTransform: "uppercase" }}>Ver →</div>
          </div>
        </a>
      ))}
    </section>
  );
}
