---
name: refactor-admin-completed
description: Refactor completo del admin completado en 10 fases — nueva estructura, shared components, rutas reales, store unificado
metadata:
  type: project
---

Refactor del módulo admin completado. Todos los cambios pasan `tsc --noEmit` sin errores.

**Why:** La auditoría identificó 10 problemas: shell duplicado, tipos `typeof DATA[number]`, módulos no separados por feature, store sin banners, InventoryModule con props en vez de store, ProductCard inline en storefront.

**How to apply:** La nueva estructura es la fuente de verdad. Los archivos `*Module.tsx` bajo `features/admin/dashboard/components/modules/` son código legacy que aun existe pero ya no es referenciado desde ninguna página. Pueden eliminarse en una limpieza futura.

## Estructura resultante

### Rutas del App Router
- `app/admin/layout.tsx` — Server Component (ya no tiene "use client")
- `app/admin/dashboard/page.tsx` → `DashboardPage`
- `app/admin/orders/page.tsx` → `OrdersPage`
- `app/admin/products/page.tsx` → `ProductsPage`
- `app/admin/inventory/page.tsx` → `InventoryPage`
- `app/admin/banners/page.tsx` → `BannersPage`
- `app/admin/users/page.tsx` → `UsersPage`

### Shared components en `features/admin/_shared/`
- `components/AdminSidebar.tsx` — Client Component, usa usePathname
- `components/AdminTopbar.tsx` — Client Component, usa usePathname
- `components/AdminDrawer.tsx` — drawer lateral para edición
- `components/StatusBadge.tsx` — badge genérico de estado (filled/outlined)
- `components/KpiCard.tsx` — tarjeta KPI reutilizable
- `components/FilterBar.tsx` — search + tabs combinados
- `lib/admin.types.ts` — tipos explícitos: Order, OrderItem, OrderStatus, User, UserStatus, Banner, BannerStatus, BannerPosition

### Pages por feature
- `features/admin/dashboard/components/DashboardPage.tsx`
- `features/admin/orders/components/OrdersPage.tsx`
- `features/admin/products/components/ProductsPage.tsx`
- `features/admin/inventory/components/InventoryPage.tsx`
- `features/admin/banners/components/BannersPage.tsx`
- `features/admin/users/components/UsersPage.tsx`

### Store (`stores/admin.store.ts`)
- Ahora incluye `banners: Banner[]` con `saveBanner` y `toggleBanner`
- Usa tipos explícitos de `admin.types.ts` (no más `typeof ORDERS_DATA[number]`)
- InventoryPage y BannersPage consumen el store directamente (no props)

### Otros cambios
- `FormField` movido a `components/ui/FormField.tsx`; `admin-styles.ts` re-exporta por compatibilidad
- `AdminDrawer` en `_shared/`, el archivo original re-exporta por compatibilidad
- `FeaturedProducts` y `NewArrivals` ahora importan `ProductCard` desde `components/shared/ProductCard.tsx`
- `router.push("/admin/products")` y `router.push("/admin/orders")` reemplazados por `<Link>`
- `admin-constants.ts` ya no usa `typeof ORDERS_DATA[number]`, importa de `admin.types.ts`

## Archivos legacy (no referenciados, pueden limpiarse)
- `features/admin/dashboard/components/modules/DashboardModule.tsx`
- `features/admin/dashboard/components/modules/OrdersModule.tsx`
- `features/admin/dashboard/components/modules/ProductsModule.tsx`
- `features/admin/dashboard/components/modules/InventoryModule.tsx`
- `features/admin/dashboard/components/modules/BannersModule.tsx`
- `features/admin/dashboard/components/modules/UsersModule.tsx`
