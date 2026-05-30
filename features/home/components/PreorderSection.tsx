import { Button } from "@/components/ui/Button";

export function PreorderSection() {
  return (
    <section style={{ padding: "80px 48px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>Disponibles pronto</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: .95 }}>Preventas</h2>
        <div style={{ fontSize: 14, color: "var(--mt)", marginTop: 8 }}>Reserva con adelanto del 50% y asegura tu pieza</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {[
          { name: "Goku Black Super Saiyan Rosé", arrival: "Ago 2026", cat: "stripe-fig", price: 89.99, badge: "PREVENTA" },
          { name: "LEGO Technic Ferrari SF-24", arrival: "Sep 2026", cat: "stripe-lego", price: 249.99, badge: "PREVENTA" },
          { name: "Lamborghini Countach 1:18", arrival: "Jul 2026", cat: "stripe-veh", price: 119.99, badge: "PREVENTA" },
        ].map((p) => (
          <div key={p.name} style={{ background: "var(--card)", border: "1px solid var(--bd)", cursor: "pointer" }}>
            <div className={p.cat} style={{ height: 200, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: 12, left: 0, background: "var(--gold)", color: "#000", fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: "5px 10px" }}>{p.badge}</div>
              <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "var(--mt)", textTransform: "uppercase" }}>preventa</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: -.3, marginBottom: 8 }}>{p.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "var(--gold)" }}>${p.price.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "var(--mt)", border: "1px solid var(--bd)", padding: "4px 10px", letterSpacing: 1, textTransform: "uppercase" }}>
                  Llegada {p.arrival}
                </div>
              </div>
              <Button variant="outline" size="sm" full>
                Reservar ahora
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
