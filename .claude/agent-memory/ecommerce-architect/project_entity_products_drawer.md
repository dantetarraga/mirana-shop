---
name: entity-products-drawer
description: EntityProductsDrawer implementado — drawer compartido para ver/gestionar productos de collections, brands y categories con search, remove y reassign
metadata:
  type: project
---

Se implementó `EntityProductsDrawer` (`shared/components/EntityProductsDrawer.tsx`) como componente Client reutilizable para los 3 módulos del admin.

**Arquitectura:**
- Recibe `entityType: "collection" | "brand" | "category"` y despacha a las actions correspondientes
- Carga productos con `useEffect` + las actions `getCollectionProducts` / `getBrandProducts` / `getCategoryProducts`
- Búsqueda con debounce 350ms → `searchAvailableProducts(query, excludeIds)` de `product.actions.ts`
- Collections: botón "Quitar" → `removeProductFromCollection` / botón "Agregar" → `addProductToCollection`
- Brands/Categories: select inline "Reasignar" → `reassignProductBrand` / `reassignProductCategory`
- Para brands/categories no hay "quitar" (FK required) — se muestra nota explicativa

**Tipo compartido:** `shared/types/entity-products.types.ts` exporta `DrawerProduct` con campos serializados (price: number, no Decimal).

**Row click en las 3 tablas:**
- `CollectionsTableClient`, `BrandsTableClient`, `CategoriesTableClient` tienen `viewingId: string | null`
- Row click → `setViewingId(c.id)`; botones Editar/Eliminar usan `e.stopPropagation()`
- `BrandsTableClient` recibe `allBrands: BrandRow[]` desde `app/admin/brands/page.tsx`
- `CategoriesTableClient` recibe `allCategories: CategoryRow[]` desde `app/admin/categories/page.tsx`

**Columna Colecciones en tabla de productos:**
- `ProductListItem` ahora incluye `collections: { collection: { id, name, slug } }[]`
- `listSelect` en `product.repo.ts` incluye `collections { take: 3 }`
- `SerializedProduct` en `ProductsClient.tsx` también incluye `collections`
- Columna entre Stock y Acciones: chips de colecciones (máx 2 + contador)

**Toast colors (Sonner v2):**
- `globals.css` tiene 4 clases `.mirana-toast-{success|error|warning|info}` con border-left + icon color
- `app/layout.tsx` usa `position="bottom-right"` y `classNames` para mapear

**Why:** Mejorar UX del admin — ver y gestionar productos desde las páginas de collections/brands/categories sin salir de la sección.

**How to apply:** Si se necesita ver/gestionar productos desde otra entidad, reutilizar `EntityProductsDrawer` con el `entityType` adecuado y agregar las actions correspondientes.
