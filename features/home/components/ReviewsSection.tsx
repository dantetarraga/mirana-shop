const REVIEWS = [
  { name: "Carlos M.", role: "Coleccionista · 3 años", initials: "CM", stars: 5, text: "La calidad de las figuras es absurda. Pedí el Iron Man Hall of Armor y llegó con un empaque que da miedo abrir. Es mi tienda fija." },
  { name: "Andrea R.", role: "Cliente nuevo", initials: "AR", stars: 5, text: "Compré el LEGO Millennium Falcon como regalo y el unboxing fue una experiencia. Envío en 48h y todo perfecto." },
  { name: "Diego F.", role: "Coleccionista · 5 años", initials: "DF", stars: 5, text: "Llevo más de 20 piezas compradas. Las ediciones limitadas se agotan rápido pero el equipo siempre responde por WhatsApp." },
  { name: "María L.", role: "Cliente recurrente", initials: "ML", stars: 4, text: "Excelente catálogo de figuras de anime. El Goku Ultra Instinct superó mis expectativas — la pintura es de otro nivel." },
  { name: "José T.", role: "Padre coleccionista", initials: "JT", stars: 5, text: "Mi hijo y yo compramos juntos cada mes. El servicio es impecable y los precios son justos para la calidad premium." },
  { name: "Sofía P.", role: "Coleccionista · 2 años", initials: "SP", stars: 5, text: "La curaduría de productos es lo mejor — no encuentras este nivel en otra tienda online en español. Recomendado 100%." },
];

export function ReviewsSection() {
  return (
    <section style={{ padding: "80px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>Testimonios</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: .95 }}>Lo que dicen<br />nuestros coleccionistas</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>4.9</span>
            <div>
              <span style={{ color: "var(--gold)", fontSize: 14 }}>★★★★★</span>
              <div style={{ fontSize: 11, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Basado en 2,847 reseñas</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {REVIEWS.map((r, i) => (
          <div key={i} className="animate-fade-up" style={{
            background: "var(--card)", border: "1px solid var(--bd)",
            padding: 28, position: "relative", transition: ".25s",
          }}>
            <div style={{ position: "absolute", top: 14, right: 18, fontFamily: "var(--font-display)", fontSize: 72, fontWeight: 900, color: "var(--gold)", opacity: .15, lineHeight: .8, fontStyle: "italic" }}>"</div>
            <div style={{ color: "var(--gold)", fontSize: 13, letterSpacing: 2, marginBottom: 14 }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", marginBottom: 20, fontWeight: 300, minHeight: 84 }}>{r.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 18, borderTop: "1px solid var(--bd)" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--gold)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16 }}>{r.initials}</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
