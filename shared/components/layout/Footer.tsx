export function Footer() {
  return (
    <footer className="border-t border-(--bd) pt-16 pb-8 px-12 grid gap-10 grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div className="font-display text-[36px] font-black tracking-[5px] mb-3.5">
          MIRA<span className="text-(--gold)">NA</span>
        </div>
        <p className="text-[13px] text-muted leading-[1.75] max-w-[220px]">
          Tu tienda premium de figuras de colección, sets LEGO y modelos a escala. Importación directa, calidad garantizada.
        </p>
      </div>

      {[
        { title: "Tienda", links: ["Catálogo", "Novedades", "Preventas", "Ediciones limitadas"] },
        { title: "Cuenta", links: ["Mi perfil", "Mis pedidos", "Favoritos", "Devoluciones"] },
        { title: "Info", links: ["Sobre MIRANA", "Envíos", "Términos", "Contacto"] },
      ].map(({ title, links }) => (
        <div key={title}>
          <h4 className="text-[10px] font-bold tracking-[2px] uppercase text-muted mb-4">{title}</h4>
          <ul className="list-none flex flex-col gap-2.5">
            {links.map((link) => (
              <li key={link}>
                <a href="#" className="footer-link text-[14px] text-text no-underline block">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="col-span-full pt-7 border-t border-(--bd) flex justify-between items-center text-[12px] text-muted">
        <span>© 2026 MIRANA. Todos los derechos reservados.</span>
        <div className="flex gap-5">
          {["Instagram", "TikTok", "YouTube", "WhatsApp"].map((s) => (
            <a key={s} href="#" className="footer-link text-muted no-underline text-[12px] block">
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
