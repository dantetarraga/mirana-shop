---
name: audit-admin-dashboard
description: Resultados de la auditoría completa del módulo admin/dashboard — problemas encontrados, código duplicado, y propuesta de refactor
metadata:
  type: project
---

Auditoría realizada 2026-05-30. El módulo admin tiene los siguientes problemas estructurales confirmados:

**Problema 1 — Doble implementación del layout admin:**
- `app/admin/layout.tsx` implementa sidebar + topbar completo (líneas 44–109)
- `features/admin/dashboard/components/AdminDashboard.tsx` reimplementa el mismo sidebar + topbar completo (líneas 50–120)
- Resultado: dos versiones del mismo shell UI coexistiendo, el layout de app/ es el correcto pero AdminDashboard vive con su propia copia

**Problema 2 — Estructura de features no sigue feature-per-section:**
- Todos los módulos viven bajo `features/admin/dashboard/` como si "dashboard" fuera la única feature
- Correcto: cada sección del admin (products, orders, inventory, banners, users) debería ser su propia feature bajo `features/admin/`

**Problema 3 — InventoryModule no usa el store (admin.store.ts):**
- ProductsModule y OrdersModule consumen `useAdminStore` correctamente
- InventoryModule (línea 10) recibe `products` y `onSave` como props en lugar de leer del store
- Inconsistencia de patrón en el mismo módulo

**Problema 4 — `FormField` en admin-styles.ts:**
- El componente React `FormField` está exportado desde un archivo de estilos (`lib/admin-styles.ts`)
- Mezcla concerns: estilos CSS-in-JS + componente React en el mismo archivo
- Debe moverse a `components/ui/FormField.tsx`

**Problema 5 — Código de ProductCard duplicado 3 veces:**
- `components/shared/ProductCard.tsx` — componente correcto
- `features/home/components/FeaturedProducts.tsx` — copia completa inline del card (líneas 27–43)
- `features/home/components/NewArrivals.tsx` — copia completa inline del card (líneas 27–43)
- La función `Stars` también se duplica: ProductCard.tsx línea 13, FeaturedProducts.tsx línea 8, NewArrivals.tsx línea 8

**Problema 6 — Tablas de datos duplicadas entre módulos:**
- Patrón "search bar + tab filters + table" aparece idéntico en ProductsModule, OrdersModule, UsersModule
- No existe un componente `DataTable` o `FilterBar` compartido

**Problema 7 — `admin-styles.ts` exporta objetos de estilo inline (S.panel, S.kpi, S.th, S.td):**
- Estos son style objects que se mezclan con inline styles en JSX
- El proyecto usa Tailwind, estos deberían ser clases CSS utilitarias
- La variable `ftab` duplica lógica que ya hace `Button variant="tab"`

**Problema 8 — Tipos no centralizados:**
- `Order` se define dos veces: en `admin-constants.ts` (línea 4) y en `admin.store.ts` (línea 6)
- Ambas son `typeof ORDERS_DATA[number]` en lugar de un tipo explícito

**Problema 9 — `app/admin/dashboard/page.tsx` renderiza `AdminDashboard` que rehace el layout:**
- `AdminDashboard.tsx` tiene su propia copia del sidebar y topbar
- `app/admin/layout.tsx` ya provee ese shell
- La page debería solo renderizar el contenido del dashboard, no el shell completo

**Problema 10 — BannersModule estado local en vez de store:**
- `banners` vive en `useState` local de BannersModule
- Si el usuario navega entre secciones, los cambios se pierden
- Debería estar en `useAdminStore`

**Why:** La estructura actual mezcla dos enfoques: un layout de App Router correcto en `app/admin/layout.tsx` con un componente monolítico `AdminDashboard.tsx` que fue el primer intento (SPA-style con `useState<Module>`) antes de migrar a rutas reales.

**How to apply:** Ver propuesta de estructura en el reporte de auditoría. Migración gradual: primero eliminar AdminDashboard, luego separar features, luego extraer componentes compartidos.
