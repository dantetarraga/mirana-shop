import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'
import Image from 'next/image'
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
      { label: 'Libro de Reclamaciones', href: '/libro-de-reclamaciones' },
    ],
  },
] as const

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2 6.34 6.34 0 0 0 9.49 21.54a6.34 6.34 0 0 0 6.34-6.34V8.72a8.2 8.2 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  )
}

function YouTubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

export async function Footer() {
  const settings = await getStoreSettings()

  const socialLinks = [
    { name: 'Instagram', url: settings.instagramUrl, Icon: InstagramIcon, color: 'text-[#E1306C]' },
    {
      name: 'TikTok',
      url: settings.tiktokUrl,
      Icon: TikTokIcon,
      color: 'text-text dark:text-white',
    },
    { name: 'YouTube', url: settings.youtubeUrl, Icon: YouTubeIcon, color: 'text-[#FF0000]' },
    { name: 'Facebook', url: settings.facebookUrl, Icon: FacebookIcon, color: 'text-[#1877F2]' },
    {
      name: 'WhatsApp',
      url: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : '',
      Icon: WhatsAppIcon,
      color: 'text-[#25D366]',
    },
  ].filter((s) => s.url)

  return (
    <footer className="border-t border-(--bd) pt-12 md:pt-16 pb-8 shell grid gap-10 grid-cols-2 sm:grid-cols-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className="col-span-2 sm:col-span-3 md:col-span-1">
        <Image
          src={settings.footerLogoUrl || '/logo.svg'}
          alt="Mirana"
          width={150}
          height={50}
          className="h-9 sm:h-10 w-auto mb-3.5 [filter:invert(1)_hue-rotate(180deg)_saturate(1.4)] dark:[filter:none]"
        />
        <p className="text-[13px] text-muted leading-[1.75] max-w-sm md:max-w-55">
          Mirana Shop es tu tienda en Arequipa de juguetes, figuras de colección y modelos a escala
          100% originales. Importación directa, calidad garantizada y novedades para todos los
          fanáticos del coleccionismo.
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

      <div className="col-span-full pt-7 border-t border-(--bd) flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[12px] text-muted">
        <span>© 2026 MIRANA. Todos los derechos reservados.</span>
        {socialLinks.length > 0 && (
          <div className="flex gap-4 flex-wrap items-center">
            {socialLinks.map(({ name, url, Icon, color }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${color} hover:opacity-75 no-underline transition-opacity duration-200 block`}
                title={name}
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}
