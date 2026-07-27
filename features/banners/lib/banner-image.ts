// ---------------------------------------------------------------------------
// Resolución de imágenes de banner.
//
// Las tres variantes son opcionales, así que hay que degradar de una a otra y,
// si no hay ninguna, el banner directamente no se puede pintar. Este módulo es
// puro (sin 'server-only'): lo usan la query del storefront y la UI del admin.
// ---------------------------------------------------------------------------

export interface BannerImages {
  imageUrl: string | null
  imageUrlMobile: string | null
  imageUrlFull: string | null
}

/** Una URL vacía es lo mismo que no tener imagen. */
function clean(url: string | null | undefined): string | null {
  const trimmed = url?.trim()
  return trimmed ? trimmed : null
}

/** ¿El banner tiene al menos una imagen utilizable? */
export function hasBannerImage(b: BannerImages): boolean {
  return clean(b.imageUrl) !== null || clean(b.imageUrlFull) !== null || clean(b.imageUrlMobile) !== null
}

/**
 * Imagen de desktop para el layout de tarjetas. Si falta la de tarjeta se cae a
 * la de pantalla completa y, en último caso, a la de mobile.
 */
export function bannerCardImage(b: BannerImages): string | null {
  return clean(b.imageUrl) ?? clean(b.imageUrlFull) ?? clean(b.imageUrlMobile)
}

/** Imagen de desktop para el hero a pantalla completa. */
export function bannerFullImage(b: BannerImages): string | null {
  return clean(b.imageUrlFull) ?? clean(b.imageUrl) ?? clean(b.imageUrlMobile)
}

/** Imagen de mobile; `null` deja que BannerImage use solo la de desktop. */
export function bannerMobileImage(b: BannerImages): string | null {
  return clean(b.imageUrlMobile)
}
