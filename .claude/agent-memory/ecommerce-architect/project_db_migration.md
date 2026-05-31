---
name: project-db-migration
description: Migración de datos mock a PostgreSQL + Prisma — qué se cambió, decisiones tomadas, archivos clave
metadata:
  type: project
---

Migración de datos mock a base de datos real (PostgreSQL + Prisma) completada en 2026-05-31.

**Why:** Las páginas admin y storefront usaban datos hardcodeados en archivos TS. La BD real ya tenía el schema definido pero sin seed ni repositorios.

**Qué se implementó:**

## Infraestructura BD
- `shared/lib/db.ts` — singleton PrismaClient con PrismaPg adapter (Pool de pg), patrón globalThis para evitar múltiples instancias en dev

## Repositorios (modules/)
- `modules/catalog/repositories/product.repo.ts` — findMany (filtros: categorySlug, brandSlug, search, featured, status), findFeatured, findNew, findBySlug, findById, count, create, update (con $transaction para stock), delete (soft)
- `modules/catalog/repositories/category.repo.ts` — findAll, findBySlug, findById
- `modules/catalog/repositories/brand.repo.ts` — findAll, findBySlug, findById
- `modules/catalog/repositories/banner.repo.ts` — findActive (respeta startsAt/endsAt), findAll, create, update, toggle, delete
- `modules/orders/repositories/order.repo.ts` — findMany (filtros), findById, findByCode, count, updateStatus, getStats
- `modules/inventory/repositories/inventory.repo.ts` — findByProductId, findLowStock, findOutOfStock, adjustStock (optimistic locking con version), getStats

## Server Actions (features/)
- `features/products/actions/product.actions.ts` — createProduct, updateProduct, deleteProduct, importProducts (upsert por SKU con resolución de categoría/marca)
- `features/banners/actions/banner.actions.ts` — saveBanner (create/update), toggleBanner, deleteBanner
- `features/inventory/actions/inventory.actions.ts` — adjustStock (reintentos automáticos ante OptimisticLockError)
- `features/orders/actions/order.actions.ts` — updateOrderStatus

## Páginas admin convertidas a Server Component + Client
- `app/admin/products/page.tsx` → Server Component → `features/products/components/ProductsClient.tsx`
- `app/admin/banners/page.tsx` → Server Component → `features/banners/components/BannersClient.tsx`
- `app/admin/inventory/page.tsx` → Server Component → `features/inventory/components/InventoryClient.tsx`
- `app/admin/orders/page.tsx` → Server Component → `features/orders/components/OrdersClient.tsx`
- `app/admin/dashboard/page.tsx` → Server Component → `features/dashboard/components/DashboardClient.tsx`
- `app/admin/users/page.tsx` → Server Component → `features/users/components/UsersClient.tsx`

## Storefront actualizado
- `features/home/components/NewArrivals.tsx` → Server Component, fetchea desde productRepo.findNew(6)
- `features/home/components/FeaturedProducts.tsx` → Server Component, fetchea featured o recent
- `app/(storefront)/catalogo/page.tsx` → Server Component → `features/catalog/components/CatalogClient.tsx`

## Tipos nuevos
- `shared/types/catalog.types.ts` — CatalogProduct (serializable, con number en vez de Decimal), helpers getCategoryStripe, getCategoryLabel
- `modules/catalog/mappers/product.mapper.ts` — toProductCard, toProductCards (Decimal → number)
- `shared/types/admin-db.types.ts` — tipos re-exportados de repositorios

## Slugs de categoría críticos (DEBEN coincidir con CATEGORY_STRIPE)
- figuras-accion → stripe-fig
- lego → stripe-lego
- modelos-escala → stripe-veh
- anime → stripe-fig

## store-context actualizado
- `shared/lib/store-context.tsx` — usa CatalogProduct en vez de Product del mock. id es string (cuid), no number.

## Schemas Zod actualizados (shared/lib/schemas.ts)
- productDbSchema — para Server Actions del admin (con slug, categoryId, brandId, status, featured)
- bannerDbSchema — para Server Actions del admin (con imageUrl, ctaHref)
- adjustStockSchema — productId + newStock + reason opcional
- updateOrderStatusSchema — orderId + status (enum de BD)
- importProductRowSchema — para importación de Excel

## Seed (prisma/seed.ts)
- 4 categorías: figuras-accion, lego, modelos-escala, anime
- 7 marcas: Hasbro, Bandai, LEGO Group, Good Smile Company, Kotobukiya, Funko, Hot Wheels
- 12 productos con imágenes placehold.co, inventory, estado, featured
- 5 órdenes con items, payment, shipping
- 4 banners (3 activos, 1 inactivo)
- 2 usuarios (admin@mirana.com y cliente@example.com)

## Comandos para arrancar
```bash
prisma generate         # generar cliente
prisma migrate dev      # aplicar migrations
pnpm db:seed           # ejecutar seed (usa tsx)
```

**How to apply:** Cuando se pida agregar features, usar estos repos como base. No crear nuevos repos sin revisar si el existente puede extenderse.

[[project-prisma-setup]]
