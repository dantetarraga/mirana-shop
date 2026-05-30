export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--bd)", padding: "64px 48px 32px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, letterSpacing: 5, marginBottom: 14 }}>
          MIRA<span style={{ color: "var(--gold)" }}>NA</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--mt)", lineHeight: 1.75, maxWidth: 220 }}>
          Tu tienda premium de figuras de colección, sets LEGO y modelos a escala. Importación directa, calidad garantizada.
        </p>
      </div>

      {[
        { title: "Tienda", links: ["Catálogo", "Novedades", "Preventas", "Ediciones limitadas"] },
        { title: "Cuenta", links: ["Mi perfil", "Mis pedidos", "Favoritos", "Devoluciones"] },
        { title: "Info", links: ["Sobre MIRANA", "Envíos", "Términos", "Contacto"] },
      ].map(({ title, links }) => (
        <div key={title}>
          <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 16 }}>{title}</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {links.map((link) => (
              <li key={link}>
                <a href="#" className="footer-link" style={{ fontSize: 14, color: "var(--text)", textDecoration: "none", display: "block" }}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ gridColumn: "1/-1", paddingTop: 28, borderTop: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--mt)" }}>
        <span>© 2026 MIRANA. Todos los derechos reservados.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Instagram", "TikTok", "YouTube", "WhatsApp"].map((s) => (
            <a key={s} href="#" className="footer-link" style={{ color: "var(--mt)", textDecoration: "none", fontSize: 12, display: "block" }}>
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
