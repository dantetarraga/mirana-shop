import { getImageProps } from 'next/image'

/**
 * Ancho a partir del cual se sirve la imagen de desktop. Por debajo (mobile y
 * tablet) se usa `imageUrlMobile` si el banner la tiene.
 */
export const BANNER_DESKTOP_MEDIA = '(min-width: 1024px)'

interface BannerImageProps {
  desktopUrl: string
  mobileUrl?: string | null
  alt: string
  /** Clases aplicadas al <img> final (posicionamiento, object-fit, etc.) */
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * Art direction real para banners: dos archivos distintos según viewport vía
 * <picture>, manteniendo la optimización de next/image en ambos (getImageProps).
 * Sin `mobileUrl` se degrada a un único <img> con la imagen de desktop.
 */
export function BannerImage({
  desktopUrl,
  mobileUrl,
  alt,
  className,
  sizes = '100vw',
  priority = false,
}: BannerImageProps) {
  const common = { alt, sizes, priority, quality: 80 }

  const { props: desktop } = getImageProps({
    ...common,
    src: desktopUrl,
    width: 1920,
    height: 600,
  })

  if (!mobileUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...desktop} className={className} alt={alt} />
  }

  const { props: mobile } = getImageProps({
    ...common,
    src: mobileUrl,
    width: 900,
    height: 1100,
  })

  return (
    <picture>
      <source media={BANNER_DESKTOP_MEDIA} srcSet={desktop.srcSet} sizes={desktop.sizes} />
      <img {...mobile} className={className} alt={alt} />
    </picture>
  )
}
