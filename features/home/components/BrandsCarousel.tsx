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
    <section style={{ padding: "60px 0", borderTop: "1px solid var(--bd)", borderBottom: "1px solid var(--bd)", overflow: "hidden" }}>
      <div style={{ padding: "0 48px 32px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>Marcas oficiales</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: .95 }}>
            Distribuidor autorizado
          </h2>
        </div>
        <div style={{ fontSize: 12, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>10+ marcas premium</div>
      </div>

      <div className="animate-marquee-slow" style={{ display: "flex", gap: 0 }}>
        {doubled.map((b, i) => (
          <div key={i} className="brand-item" style={{
            flexShrink: 0, width: 240, height: 120,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRight: "1px solid var(--bd)", padding: "0 32px",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: b.serif ? "Georgia,serif" : b.mono ? "monospace" : "var(--font-display)",
                fontWeight: 900, textTransform: "uppercase", letterSpacing: 1,
                fontSize: b.mono ? 20 : 24, color: "var(--text)",
                fontStyle: b.italic ? "italic" : "normal",
                lineHeight: 1,
              }}>
                {b.name}
              </div>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: 3,
                fontWeight: 500, color: "var(--mt)", marginTop: 6,
              }}>
                {b.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
