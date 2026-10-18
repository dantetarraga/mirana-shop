import { providerLine } from '@/features/complaints/lib/complaint-sheet'
import { getPickupStores } from '@/features/delivery/queries/delivery.queries'
import { MiranaLogo } from '@/shared/components/brand/MiranaLogo'
import { getStoreSettings, getWhatsappPhone } from '@/features/settings/queries/store-settings.queries'
import { ArrowRight, BookOpen, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { safeHref } from '@/shared/schemas/safe-url.schema'

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

/**
 * Número de WhatsApp tal como se lee: el texto de NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY
 * si corresponde al número en uso; si no, "+51 987 654 321" armado de los dígitos.
 */
function whatsappDisplay(phone: string): string {
  const envDisplay = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY
  if (envDisplay && phone === process.env.NEXT_PUBLIC_WHATSAPP_PHONE) return envDisplay
  const peru = /^51(\d{3})(\d{3})(\d{3})$/.exec(phone)
  return peru ? `+51 ${peru[1]} ${peru[2]} ${peru[3]}` : `+${phone}`
}

const HEADING_CLS = 'text-[10px] font-bold tracking-[2px] uppercase text-muted mb-4'

export async function Footer() {
  const [settings, whatsappPhone, stores] = await Promise.all([
    getStoreSettings(),
    getWhatsappPhone(),
    getPickupStores(),
  ])
  // Razón social · RUC · domicilio fiscal del proveedor (se configura en /admin/settings)
  const legalLine = providerLine(settings)

  // Solo las redes que el admin configuró en /admin/settings. WhatsApp no va
  // aquí: es un canal de contacto y tiene su propio bloque.
  const socialLinks = [
    { name: 'Instagram', url: settings.instagramUrl, Icon: InstagramIcon, color: 'text-[#E1306C]' },
    { name: 'TikTok', url: settings.tiktokUrl, Icon: TikTokIcon, color: 'text-text' },
    { name: 'YouTube', url: settings.youtubeUrl, Icon: YouTubeIcon, color: 'text-[#FF0000]' },
    { name: 'Facebook', url: settings.facebookUrl, Icon: FacebookIcon, color: 'text-[#1877F2]' },
  ]
    .map((social) => ({ ...social, url: safeHref(social.url) }))
    .filter((social) => social.url)

  // Mismo número que el botón flotante (ajustes → env legacy).
  const whatsappHref = whatsappPhone ? safeHref(`https://wa.me/${whatsappPhone}`) : ''
  const hasContactColumn = Boolean(whatsappHref) || socialLinks.length > 0

  return (
    <footer className="border-t border-(--bd) pt-12 md:pt-16 pb-8 shell grid gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
      <div className="col-span-2 sm:col-span-3 lg:col-span-1">
        {settings.footerLogoUrl ? (
          <Image
            src={settings.footerLogoUrl}
            alt="Mirana"
            width={150}
            height={50}
            className="h-9 sm:h-10 w-auto mb-3.5"
          />
        ) : (
          <MiranaLogo className="h-8 w-auto mb-4 text-text" />
        )}
        <p className="text-[13px] text-muted leading-[1.75] max-w-sm lg:max-w-55">
          Mirana Shop es tu tienda en Arequipa de juguetes, figuras de colección y modelos a escala
          100% originales. Importación directa, calidad garantizada y novedades para todos los
          fanáticos del coleccionismo.
        </p>

        {/* Acceso visible al Libro de Reclamaciones Virtual (D.S. 011-2011-PCM) */}
        <Link
          href="/libro-de-reclamaciones"
          className="mt-5 inline-flex items-center gap-2.5 border border-(--bd) hover:border-(--gold) px-3.5 py-2.5 text-[13px] font-semibold text-text no-underline transition-colors duration-200"
        >
          <BookOpen size={22} aria-hidden="true" className="text-accent-ink shrink-0" />
          Libro de Reclamaciones
        </Link>
      </div>

      {FOOTER_NAVIGATION.map(({ title, links }) => (
        <nav key={title} aria-label={title}>
          <h2 className={HEADING_CLS}>{title}</h2>

          <ul className="list-none flex flex-col gap-2.5">
            {links.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="footer-link text-[14px] no-underline inline-block py-1">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}

      {hasContactColumn && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 content-start gap-10 lg:gap-8">
          {whatsappHref && (
            <div>
              <h2 className={HEADING_CLS}>Contacto</h2>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 py-1 text-[14px] text-text no-underline"
              >
                <span className="w-11 h-11 rounded-full border border-(--bd) bg-card flex items-center justify-center text-[#128C7E] dark:text-whatsapp shrink-0 transition-colors duration-200 group-hover:border-(--bdh)">
                  <WhatsAppIcon size={19} />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[12px] text-muted">WhatsApp</span>
                  <span className="font-semibold transition-colors duration-200 group-hover:text-accent-ink">
                    {whatsappDisplay(whatsappPhone)}
                  </span>
                </span>
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className={whatsappHref ? 'sm:col-span-2 lg:col-span-1' : 'col-span-2 sm:col-span-3 lg:col-span-1'}>
              <h2 className={HEADING_CLS}>Síguenos</h2>
              <ul className="list-none flex flex-wrap gap-2.5">
                {socialLinks.map(({ name, url, Icon, color }) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${name} (se abre en una pestaña nueva)`}
                      title={name}
                      className={`${color} w-11 h-11 rounded-full border border-(--bd) bg-card flex items-center justify-center no-underline transition-[border-color,transform] duration-200 hover:border-(--bdh) hover:-translate-y-0.5`}
                    >
                      <Icon size={19} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sedes de retiro en tienda (métodos PICKUP activos de /admin/delivery) */}
      {stores.length > 0 && (
        <section aria-labelledby="footer-stores" className="col-span-full pt-8 border-t border-(--bd)">
          <h2 id="footer-stores" className={HEADING_CLS}>
            Nuestras tiendas
          </h2>
          <ul className="list-none grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((store) => (
              <li key={store.id} className="flex gap-3 border border-(--bd) bg-card p-4">
                <MapPin size={20} aria-hidden="true" className="text-accent-ink shrink-0 mt-0.5" />
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="font-display font-bold uppercase text-[15px] tracking-[1px] leading-tight">
                    {store.label}
                  </p>
                  <p className="text-[13px] text-muted leading-snug">{store.address}</p>
                  <a
                    href={safeHref(store.mapUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 self-start py-1.5 text-[13px] font-semibold text-accent-ink no-underline hover:underline underline-offset-2"
                  >
                    Cómo llegar
                    <ArrowRight size={14} aria-hidden="true" />
                    <span className="sr-only">
                      {` a ${store.label} (Google Maps, se abre en una pestaña nueva)`}
                    </span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="col-span-full pt-7 border-t border-(--bd) flex flex-col gap-1 text-[12px] text-muted">
        <span>© 2026 MIRANA. Todos los derechos reservados.</span>
        {legalLine && <span>{legalLine}</span>}
      </div>
    </footer>
  )
}
