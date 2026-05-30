export function PromoBanner() {
  const items = ["Envío gratis en pedidos +$75", "Figuras exclusivas de importación", "Preventas con adelanto del 50%", "Más de 500 productos", "Pago seguro con Culqi", "Devoluciones en 30 días"];
  const doubled = [...items, ...items];
  return (
    <div style={{ background: "var(--gold)", color: "#000", padding: "11px 0", overflow: "hidden" }}>
      <div className="animate-marquee" style={{ display: "flex", whiteSpace: "nowrap" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", padding: "0 28px", display: "inline-flex", alignItems: "center", gap: 14 }}>
            {item} <span style={{ opacity: .35, fontSize: 9 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
