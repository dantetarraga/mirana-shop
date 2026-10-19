import { providerLine } from '@/features/complaints/lib/complaint-sheet'
import { getPickupStores } from '@/features/delivery/queries/delivery.queries'
import { SOCIAL_NETWORKS } from '@/features/settings/lib/social-networks'
import {
  getStoreSettings,
  getWhatsappPhone,
} from '@/features/settings/queries/store-settings.queries'
import { MiranaLogo, MiranaMark } from '@/shared/components/brand/MiranaLogo'
import { SocialIcon, socialBrandColor } from '@/shared/components/ui/SocialIcon'
import { safeHref } from '@/shared/schemas/safe-url.schema'
import { ArrowUpRight, BookOpen, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Footer: franja navy en ambos temas para cerrar la página. Arriba la marca,
// las redes y el contacto; al centro la navegación con las tiendas como una
// columna más; abajo los datos legales y el acceso al Libro de Reclamaciones
// (un solo distintivo, reconocible, como pide el D.S. 011-2011-PCM).
// ---------------------------------------------------------------------------

const FOOTER_NAVIGATION = [
  {
    title: 'Tienda',
    links: [
      { label: 'Catálogo', href: '/catalogo' },
      { label: 'Novedades', href: '/catalogo?sort=newest' },
      { label: 'Preventas', href: '/catalogo?avail=preorder' },
      { label: 'Ofertas', href: '/catalogo?oferta=1' },
      { label: 'Marcas', href: '/marcas' },
    ],
  },
  {
    title: 'Tu cuenta',
    links: [
      { label: 'Mis pedidos', href: '/cuenta/pedidos' },
      { label: 'Mi perfil', href: '/cuenta/perfil' },
      { label: 'Mis direcciones', href: '/cuenta/direcciones' },
      { label: 'Carrito', href: '/carrito' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Términos y condiciones', href: '/terminos-y-condiciones' },
      { label: 'Política de privacidad', href: '/politica-de-privacidad' },
    ],
  },
] as const

// La franja es navy en ambos temas: los tokens del logo van fijos para fondo oscuro.
const ON_NAVY_BRAND = '[--brand-moon:#00c8ff] [--brand-slate:#5d7389]'

const HEADING_CLS = 'font-sans text-[14px] font-semibold text-on-media mb-4'
const LINK_CLS =
  'inline-block py-1 text-[14px] text-on-media/70 no-underline transition-colors hover:text-on-media focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon)'

function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
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

export async function Footer() {
  const [settings, whatsappPhone, stores] = await Promise.all([
    getStoreSettings(),
    getWhatsappPhone(),
    getPickupStores(),
  ])
  // Razón social · RUC · domicilio fiscal del proveedor (se configura en /admin/settings)
  const legalLine = providerLine(settings)

  // Solo las redes que el admin agregó en /admin/settings, en su orden.
  const socialLinks = settings.socialLinks
    .map((link) => ({ ...link, url: safeHref(link.url) }))
    .filter((link) => link.url)

  // Mismo número que el botón flotante (ajustes → env legacy).
  const whatsappHref = whatsappPhone ? safeHref(`https://wa.me/${whatsappPhone}`) : ''
  const year = new Date().getFullYear()

  return (
    <footer
      className={`relative isolate overflow-hidden bg-(--brand-navy) text-on-media ${ON_NAVY_BRAND}`}
    >
      {/* Las garras de la marca, enormes y casi transparentes en la esquina: el
          único gesto decorativo del footer. */}
      <MiranaMark className="pointer-events-none absolute -right-24 -bottom-28 w-[30rem] h-[30rem] -z-10 opacity-[0.05] text-on-media" />

      <div className="shell pt-12 md:pt-16">
        {/* ── Marca, redes y contacto ── */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between pb-10 border-b border-white/10">
          <div className="max-w-sm">
            {settings.footerLogoUrl ? (
              <Image
                src={settings.footerLogoUrl}
                alt="Mirana"
                width={150}
                height={50}
                className="h-9 sm:h-10 w-auto"
              />
            ) : (
              <MiranaLogo className="h-9 w-auto text-on-media" />
            )}
            <p className="mt-4 text-[14px] leading-relaxed text-on-media/70">
              Figuras, LEGO y modelos a escala 100% originales, con importación directa. Desde
              Arequipa para todo el Perú.
            </p>
          </div>

          {(socialLinks.length > 0 || whatsappHref) && (
            <div className="flex flex-col gap-4 md:items-end">
              {socialLinks.length > 0 && (
                <ul aria-label="Redes sociales" className="list-none flex flex-wrap gap-2.5">
                  {socialLinks.map(({ network, url }) => {
                    const label = SOCIAL_NETWORKS[network].label
                    return (
                      <li key={network}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${label} (se abre en una pestaña nueva)`}
                          title={label}
                          style={{ '--net': socialBrandColor(network) } as CSSProperties}
                          className="grid place-items-center w-11 h-11 rounded-full bg-white/8 text-on-media ring-1 ring-white/15 transition-[background-color,color,transform] duration-200 hover:bg-white hover:text-(--net) hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon) motion-reduce:hover:translate-y-0"
                        >
                          <SocialIcon network={network} size={18} />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 self-start md:self-end h-12 pl-3 pr-4 rounded-full bg-white/8 ring-1 ring-white/15 text-on-media no-underline transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon)"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-whatsapp text-on-whatsapp">
                    <WhatsAppGlyph size={17} />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[11px] text-on-media/65">Escríbenos por WhatsApp</span>
                    <span className="text-[14px] font-semibold">
                      {whatsappDisplay(whatsappPhone)}
                    </span>
                  </span>
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Navegación y tiendas ── */}
        <div className="grid gap-x-8 gap-y-10 py-10 grid-cols-2 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.6fr]">
          {FOOTER_NAVIGATION.map(({ title, links }) => (
            <nav key={title} aria-label={title}>
              <h2 className={HEADING_CLS}>{title}</h2>
              <ul className="list-none flex flex-col gap-1.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className={LINK_CLS}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Sedes de retiro en tienda (métodos PICKUP activos de /admin/delivery) */}
          {stores.length > 0 && (
            <section
              aria-labelledby="footer-stores"
              className="col-span-2 md:col-span-3 lg:col-span-1"
            >
              <h2 id="footer-stores" className={HEADING_CLS}>
                Nuestras tiendas
              </h2>
              <ul className="list-none grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {stores.map((store) => (
                  <li key={store.id} className="flex gap-3">
                    <MapPin
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-(--brand-moon)"
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-on-media leading-snug">
                        {store.label}
                      </p>
                      <p className="text-[13px] text-on-media/65 leading-snug">{store.address}</p>
                      <a
                        href={safeHref(store.mapUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 py-1 text-[13px] font-semibold text-(--brand-moon) no-underline hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon)"
                      >
                        Cómo llegar
                        <ArrowUpRight size={14} aria-hidden="true" />
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
        </div>

        {/* ── Legal y Libro de Reclamaciones ── */}
        {/* El distintivo va a la izquierda: abajo a la derecha está el botón
            flotante de WhatsApp y lo tapaba. */}
        <div className="flex flex-col gap-5 py-7 border-t border-white/10 md:flex-row md:items-center md:gap-8">
          {/* Acceso visible al Libro de Reclamaciones Virtual (D.S. 011-2011-PCM) */}
          <Link
            href="/libro-de-reclamaciones"
            className="group inline-flex shrink-0 items-center gap-3 self-start h-14 pl-2 pr-5 rounded-full bg-white/8 ring-1 ring-white/15 text-on-media no-underline transition-colors hover:bg-white/14 hover:ring-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon)"
          >
            <span className="grid place-items-center w-10 h-10 rounded-full bg-(--brand-moon)/15 text-(--brand-moon) ring-1 ring-(--brand-moon)/30">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold">Libro de Reclamaciones</span>
              <span className="text-[12px] text-on-media/65">Registra tu queja o reclamo</span>
            </span>
          </Link>
          <div className="flex flex-col gap-1 text-[12px] text-on-media/60">
            <span>© {year} MIRANA. Todos los derechos reservados.</span>
            {legalLine && <span>{legalLine}</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}
