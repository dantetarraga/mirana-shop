'use client'

import { FadeImage } from '@/shared/components/ui/FadeImage'
import { cn } from '@/shared/lib/utils'
import Link from 'next/link'

export interface BrandShowcaseItem {
  id: string
  name: string
  slug: string
  /** Imagen de la marca subida en el admin: si existe, llena el círculo. */
  imageUrl: string | null
  tagline: string | null
  productCount: number
  /** Foto de respaldo: heroUrl de la marca o su producto destacado. */
  coverUrl: string | null
}

interface BrandsCarouselProps {
  /** Destacadas en el orden del admin (`position`); enlazan a /marcas/[slug]. */
  brands: BrandShowcaseItem[]
}

/** Mínimo de círculos por vuelta: con pocas marcas la fila se repite para
 *  que el bucle no deje un hueco en pantallas anchas. */
const MIN_PER_LOOP = 10
/** Segundos por marca: la velocidad es la misma con 4 o con 20 marcas. */
const SECONDS_PER_ITEM = 3.5

function BrandCircle({ brand, hidden }: { brand: BrandShowcaseItem; hidden?: boolean }) {
  // Siempre a sangre: la imagen ocupa el círculo entero. Para que un logo no
  // se recorte, conviene subirlo cuadrado y con el fondo ya incluido.
  const src = brand.imageUrl || brand.coverUrl
  return (
    <li className="shrink-0 px-3 sm:px-4" aria-hidden={hidden || undefined}>
      <Link
        href={`/marcas/${brand.slug}`}
        tabIndex={hidden ? -1 : undefined}
        className="group flex flex-col items-center gap-3 w-28 sm:w-36 no-underline focus-visible:outline-none"
      >
        <span
          className={cn(
            'relative block w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden',
            'ring-1 ring-(--bd) ring-offset-4 ring-offset-bg transition-[box-shadow,transform] duration-300',
            'group-hover:ring-2 group-hover:ring-(--brand-moon) group-hover:-translate-y-1',
            'group-focus-visible:ring-2 group-focus-visible:ring-ring',
            'motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
            'bg-(--brand-navy)',
          )}
        >
          {src ? (
            <FadeImage
              src={src}
              alt=""
              fill
              sizes="144px"
              className="object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-3 text-center font-display font-black uppercase leading-none text-on-media text-[18px]">
              {brand.name}
            </span>
          )}
        </span>
        <span className="text-center font-display font-bold uppercase tracking-[0.3px] text-[14px] sm:text-[15px] leading-tight text-text group-hover:text-accent-ink transition-colors">
          {brand.name}
        </span>
      </Link>
    </li>
  )
}

/**
 * Marcas del inicio: círculos en una fila que avanza sola en bucle infinito.
 * Se detiene con el mouse o el foco (WCAG 2.2.2) y, con movimiento reducido,
 * queda quieta y se recorre deslizando. La segunda copia de la fila solo
 * existe para cerrar el bucle: es invisible para lectores y teclado.
 */
export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  if (brands.length === 0) return null

  const repeats = Math.max(1, Math.ceil(MIN_PER_LOOP / brands.length))
  const loop = Array.from({ length: repeats }, () => brands).flat()
  const duration = `${loop.length * SECONDS_PER_ITEM}s`

  return (
    <section aria-labelledby="home-brands-title" className="pt-12 md:pt-16">
      <div className="shell flex items-end justify-between gap-4 mb-6">
        <h2
          id="home-brands-title"
          className="font-display font-black uppercase tracking-[-0.5px] leading-none text-[clamp(26px,3.4vw,40px)]"
        >
          Marcas
        </h2>
        <Link
          href="/marcas"
          className="text-[13px] font-semibold text-accent-ink underline underline-offset-2 hover:no-underline"
        >
          Ver todas
        </Link>
      </div>

      <div
        data-brand-marquee
        className="relative overflow-hidden motion-reduce:overflow-x-auto py-2 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]"
      >
        <ul
          className="flex w-max animate-marquee motion-reduce:animate-none"
          style={{ animationDuration: duration }}
        >
          {loop.map((b, i) => (
            <BrandCircle key={`a-${i}-${b.id}`} brand={b} hidden={i >= brands.length} />
          ))}
          {/* Copia para el bucle: el marquee se desplaza -50%. */}
          {loop.map((b, i) => (
            <BrandCircle key={`b-${i}-${b.id}`} brand={b} hidden />
          ))}
        </ul>
      </div>
    </section>
  )
}
