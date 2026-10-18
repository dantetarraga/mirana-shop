'use client'

// ---------------------------------------------------------------------------
// Loader de next/image (images.loaderFile en next.config.ts).
//
// Las imágenes no pasan por el optimizador de Next (sharp en el hosting era lo
// que fallaba); en su lugar cada CDN redimensiona por URL. Antes, con
// `unoptimized: true`, el navegador descargaba el original de Cloudinary
// aunque la tarjeta midiera 220px. Ahora el `srcSet` que arma next/image pide
// a cada CDN el ancho exacto.
//
// - Cloudinary: inyecta `w_<ancho>,c_limit,f_auto,q_<calidad|auto>` tras
//   `/upload/`. c_limit nunca agranda una imagen más chica que el ancho pedido.
// - Unsplash: sus parámetros `w`, `q` y `auto=format`.
// - Cualquier otra URL (rutas locales como /logo.svg, picsum…) sale intacta.
// ---------------------------------------------------------------------------

interface ImageLoaderParams {
  src: string
  width: number
  quality?: number
}

const CLOUDINARY_HOST = 'res.cloudinary.com'
const UPLOAD_SEGMENT = '/upload/'

/**
 * ¿El segmento es una transformación de Cloudinary? (`f_auto,q_auto`,
 * `w_400,c_fill`…). Los segmentos de versión (`v1712345678`) y las carpetas no.
 */
function isTransformationSegment(segment: string): boolean {
  return segment.split(',').every((part) => /^[a-z]{1,3}_[^/]+$/.test(part))
}

/** Formato y calidad los decide el loader: si la URL guardada ya los trae, sobran. */
const MANAGED_PARAMS = /^(f|q)_/

function cloudinaryLoader(url: URL, width: number, quality?: number): string {
  const index = url.pathname.indexOf(UPLOAD_SEGMENT)
  // Solo las entregas `upload` admiten transformaciones por path; `fetch`,
  // `private` y otras se dejan como están.
  if (index === -1) return url.toString()

  const transformation = `w_${width},c_limit,f_auto,q_${quality || 'auto'}`
  const head = url.pathname.slice(0, index + UPLOAD_SEGMENT.length)
  const rest = url.pathname.slice(index + UPLOAD_SEGMENT.length)
  const [first = '', ...others] = rest.split('/')

  if (!isTransformationSegment(first)) {
    url.pathname = `${head}${transformation}/${rest}`
    return url.toString()
  }

  // Las URLs que guarda la subida ya traen `f_auto,q_auto` (ver
  // features/uploads/lib/media-folder.ts): esos parámetros se quitan. Si queda
  // algo (un recorte, un efecto), se aplica primero y el redimensionado va
  // encadenado después, que es como Cloudinary procesa los segmentos.
  const kept = first.split(',').filter((part) => !MANAGED_PARAMS.test(part))
  const segments = kept.length > 0 ? [kept.join(','), transformation] : [transformation]
  url.pathname = [head.slice(0, -1), ...segments, ...others].join('/')
  return url.toString()
}

function unsplashLoader(url: URL, width: number, quality?: number): string {
  // Con `fit=crop` y un `h` fijo, cambiar solo `w` deforma el recorte (una
  // miniatura de 128px pedía 128×800 y salía con zoom). Se escala `h` en la
  // misma proporción para conservar el aspecto original de la URL.
  const originalW = Number(url.searchParams.get('w'))
  const originalH = Number(url.searchParams.get('h'))
  if (originalW > 0 && originalH > 0) {
    url.searchParams.set('h', String(Math.round((originalH * width) / originalW)))
  }
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality || 75))
  if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
  return url.toString()
}

export default function imageLoader({ src, width, quality }: ImageLoaderParams): string {
  // Rutas locales (/logo.svg, /opengraph-image) y data:/blob: no se tocan.
  if (!/^https?:\/\//.test(src)) return src

  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }

  if (url.hostname === CLOUDINARY_HOST) return cloudinaryLoader(url, width, quality)
  if (url.hostname === 'images.unsplash.com' || url.hostname === 'plus.unsplash.com') {
    return unsplashLoader(url, width, quality)
  }
  return src
}
