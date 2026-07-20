// ---------------------------------------------------------------------------
// Tipos de dominio del catálogo público — compatibles con la UI del storefront
// ---------------------------------------------------------------------------

import type { ProductStatus } from "@/generated/prisma/client";

/**
 * Producto normalizado para componentes de UI del storefront.
 * Se deriva de ProductListItem del repo y se serializa para el cliente.
 */
export type CatalogProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  status: ProductStatus;
  featured: boolean;
  createdAt: Date;
  /** Calculado al mapear (server): creado en los últimos 30 días */
  isNewArrival: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string };
  imageUrl: string | null;
  images: { url: string; alt: string | null }[];
  stock: number;
};

// ---------------------------------------------------------------------------
// Helpers de categoría para la UI
// ---------------------------------------------------------------------------

export const CATEGORY_STRIPE: Record<string, string> = {
  "figuras-accion": "stripe-fig",
  lego: "stripe-lego",
  "modelos-escala": "stripe-veh",
  anime: "stripe-fig",
};

export const CATEGORY_LABEL_MAP: Record<string, string> = {
  "figuras-accion": "Figura de Acción",
  lego: "Set LEGO",
  "modelos-escala": "Modelo Escala",
  anime: "Figura Anime",
};

export function getCategoryStripe(slug: string): string {
  return CATEGORY_STRIPE[slug] ?? "stripe-fig";
}

export function getCategoryLabel(slug: string): string {
  return CATEGORY_LABEL_MAP[slug] ?? "Coleccionable";
}
