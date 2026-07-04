import Link from 'next/link'

const FOOTER_NAVIGATION = [
  {
    title: 'Tienda',
    links: [
      { label: 'Catálogo', href: '/catalogo' },
      { label: 'Novedades', href: '/catalogo?sort=newest' },
      { label: 'Preventas', href: '/catalogo?avail=preorder' },
      { label: 'Ofertas', href: '/catalogo?oferta=1' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Mi perfil', href: '/cuenta/perfil' },
      { label: 'Mis pedidos', href: '/cuenta/pedidos' },
      { label: 'Mis direcciones', href: '/cuenta/direcciones' },
      { label: 'Carrito', href: '/carrito' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y Condiciones', href: '/terminos-y-condiciones' },
      { label: 'Política de Privacidad', href: '/politica-de-privacidad' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-(--bd) pt-16 pb-8 shell grid gap-10 grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div className="font-display text-[36px] font-black tracking-[5px] mb-3.5">
          MIRA<span className="text-(--gold)">NA</span>
        </div>
        <p className="text-[13px] text-muted leading-[1.75] max-w-55">
          Tu tienda premium de figuras de colección, sets LEGO y modelos a escala. Importación
          directa, calidad garantizada.
        </p>
      </div>

      {FOOTER_NAVIGATION.map(({ title, links }) => (
        <div key={title}>
          <h4 className="text-[10px] font-bold tracking-[2px] uppercase text-muted mb-4">
            {title}
          </h4>

          <ul className="list-none flex flex-col gap-2.5">
            {links.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="footer-link text-[14px] text-text no-underline block">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="col-span-full pt-7 border-t border-(--bd) flex justify-between items-center text-[12px] text-muted">
        <span>© 2026 MIRANA. Todos los derechos reservados.</span>
        <div className="flex gap-5">
          {['Instagram', 'TikTok', 'YouTube', 'WhatsApp'].map((s) => (
            <a key={s} href="#" className="footer-link text-muted no-underline text-[12px] block">
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
