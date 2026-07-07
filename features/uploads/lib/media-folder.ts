export const ALLOWED_FOLDERS = [
  'products',
  'brands',
  'categories',
  'banners',
  'cta',
  'collections',
] as const
export type UploadFolder = (typeof ALLOWED_FOLDERS)[number]

export const FOLDER_LABELS: Record<UploadFolder, string> = {
  products: 'Productos',
  brands: 'Marcas',
  categories: 'Categorías',
  banners: 'Banners',
  cta: 'CTA',
  collections: 'Colecciones',
}

/** Inyecta f_auto,q_auto (formato/calidad automáticos) en una URL de Cloudinary. */
export function withAutoFormat(url: string): string {
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}
