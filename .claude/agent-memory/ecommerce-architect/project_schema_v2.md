---
name: project-schema-v2
description: Schema Prisma v2: Collection, ProductCollection, salePrice en Product, description+imageUrl en Brand y Category
metadata:
  type: project
---

Se aplicó la migración `20260531212418_add_collections_brand_category_fields`.

Nuevos modelos:
- `Collection` — id, name(unique), slug(unique), description, imageUrl, active, deletedAt, updatedAt
- `ProductCollection` — join table con @@id([productId, collectionId])

Campos nuevos:
- `Brand.description String? @db.Text`, `Brand.imageUrl String?`
- `Category.description String? @db.Text`, `Category.imageUrl String?`
- `Product.salePrice Decimal? @db.Decimal(10,2)` — precio con descuento. Cuando < price hay descuento activo. `compareAtPrice` también existe (precio tachado).

Seed ejecutado correctamente: 3 colecciones (bestsellers-2025, anime-figures, lego-technic), productos asociados, salePrice en 6 productos, description+imageUrl en todas las marcas y categorías.

**Why:** Expandir catálogo con colecciones, enriquecer marcas/categorías para páginas de landing y añadir precio de venta explícito.

**How to apply:** Al generar queries de productos verificar que `salePrice` puede ser null. La lógica de descuento activo: `salePrice !== null && salePrice < price`.
