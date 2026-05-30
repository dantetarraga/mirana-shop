export function HeroSection() {
  return (
    <section style={{
      minHeight: "100vh", paddingTop: "var(--nh)",
      display: "flex", alignItems: "center",
      position: "relative", overflow: "hidden",
      paddingLeft: 48, paddingRight: 48,
    }}>
      {/* Neon background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(80,150,255,.08) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 70%, rgba(80,150,255,.05) 0%, transparent 50%)",
      }} />

      {/* Ghost text */}
      <div style={{
        position: "absolute", right: -60, top: "50%",
        transform: "translateY(-52%)",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(180px,20vw,300px)",
        fontWeight: 900, fontStyle: "italic",
        color: "transparent",
        WebkitTextStroke: "1px rgba(80,150,255,.06)",
        lineHeight: 1, pointerEvents: "none",
        whiteSpace: "nowrap", userSelect: "none", letterSpacing: -6,
      }}>
        COLLECT
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 580 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--gd)", border: "1px solid rgba(80,150,255,.25)",
          padding: "6px 14px", fontSize: 10, fontWeight: 700,
          letterSpacing: 3, textTransform: "uppercase",
          color: "var(--gold)", marginBottom: 28,
        }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, background: "var(--gold)", borderRadius: "50%", display: "inline-block" }} />
          Nueva temporada 2026
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: "clamp(60px,8vw,108px)", lineHeight: .9,
          letterSpacing: -2, textTransform: "uppercase", marginBottom: 24,
        }}>
          Colecciona<br />
          lo <em style={{ color: "var(--gold)", fontStyle: "normal", display: "block" }}>Extraordinario</em>
        </h1>

        <p style={{ fontSize: 16, color: "var(--mt)", maxWidth: 400, lineHeight: 1.75, marginBottom: 40, fontWeight: 300 }}>
          Figuras de acción, sets LEGO y modelos a escala. Para coleccionistas que no se conforman con menos.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/catalogo" className="btn-gold">Ver Catálogo</a>
          <a href="/catalogo?cat=figures" className="btn-outline-mirana">Novedades →</a>
        </div>

        <div style={{ display: "flex", gap: 36, marginTop: 52, paddingTop: 32, borderTop: "1px solid var(--bd)" }}>
          {[
            { n: "500+", l: "Productos" },
            { n: "12K", l: "Coleccionistas" },
            { n: "4.9★", l: "Valoración" },
          ].map(({ n, l }) => (
            <div key={l}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual placeholder */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "42%", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div className="stripe-fig" style={{
          width: 380, height: 480,
          border: "1px solid var(--bd)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 10,
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, color: "var(--mt)", textTransform: "uppercase" }}>product shot</span>
        </div>
      </div>
    </section>
  );
}
