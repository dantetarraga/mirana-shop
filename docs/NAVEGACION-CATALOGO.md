# Navegación de catálogo: categorías, subcategorías y marcas

Especificación de diseño y administración (2026-10-17). Fuente de verdad para el
menú, las páginas de categoría/marca y su gestión en el admin.

## 1. Diagnóstico del estado actual

| Pieza | Hoy | Problema |
|---|---|---|
| Barra de categorías (`features/home/components/QuickFiltersBar.tsx`) | Solo en la home. Muestra las **5 categorías raíz con más productos** (`slice(0, 5)`), automático. | El admin no decide qué aparece ni en qué orden; una categoría nueva puede desplazar a otra estratégica; fuera de la home no existe. |
| Subcategorías | Dropdown solo con `onMouseEnter` (1–3 columnas según cantidad). | Inaccesible en táctil y teclado; sin "Ver todo"; sin límite: 30 hijas = panel gigante. |
| Marcas en la barra | Dropdown con **todas** las marcas. | Crece sin límite; sin página de marca. |
| Navbar principal | Solo "Catálogo". | En PDP/catálogo no hay acceso a categorías. |
| Menú móvil | Las 8 primeras categorías raíz (lista plana) + 8 colecciones. | Sin subcategorías, sin marcas, orden por cantidad de productos. |
| Enlaces | `/catalogo?cat=slug` | No indexables (canonical a `/catalogo`), migas con nombres fijos en código. |

## 2. Reglas de diseño

**Jerarquía:** máximo **2 niveles** (Categoría → Subcategoría). Se valida al guardar.

**Qué entra al menú lo decide el admin**, no el conteo de productos:
- `Category.showInMenu` (solo raíces) + `Category.position` (orden).
- Subcategorías: aparecen bajo su padre ordenadas por `position`; `isVisible=false` las oculta en toda la tienda.
- Una categoría sin productos visibles (incluyendo descendientes) no se muestra en el menú aunque esté marcada.

**Límites (constantes en `features/categories/lib/menu-limits.ts`):**

| Lugar | Límite | Desborde |
|---|---|---|
| Barra desktop (raíces en menú) | **6** | Ítem "Más ▾" con el resto |
| Subcategorías por columna del mega-menú | **6** | Enlace "Ver todo {Categoría} →" |
| Marcas en el mega-menú | **8** logos `featured` | "Todas las marcas →" (`/marcas`) |
| Menú móvil | Sin límite (acordeón) | — |
| Admin | Aviso cuando hay más de 6 raíces en menú: "Solo se ven 6 en escritorio; el resto va a 'Más'". |

**Desktop: mega-menú en el Navbar (todas las páginas).**
- Ítems de la barra: `Tienda ▾` · Preventas · Novedades · Ofertas.
- `Tienda` abre un panel a todo el ancho (botón con `aria-expanded`, abre con clic/Enter, cierra con Escape y clic fuera; hover con intención de 150 ms solo como mejora):
  - Columnas: una por categoría raíz del menú (máx. 6), título enlazado a `/categorias/[slug]`, hasta 6 subcategorías y "Ver todo".
  - Columna lateral: logos de marcas destacadas (máx. 8) + "Todas las marcas"; debajo, colecciones activas (máx. 4).
- La `QuickFiltersBar` de la home pasa a ser una fila de **chips** de accesos rápidos (Preventas, Novedades, En stock, Ofertas + raíces del menú) sin dropdowns, para no duplicar el mega-menú.

**Móvil: drawer con acordeón.**
- Secciones: Accesos rápidos → Categorías (cada raíz es un acordeón con sus hijas y "Ver todo") → Marcas (grilla de logos destacados + "Todas") → Colecciones → Mi cuenta.

**Páginas:**
- `/categorias/[slug]`: hero (imagen + descripción), migas jerárquicas, chips de subcategorías con conteo, grilla de productos **incluyendo descendientes**, filtros de marca/precio/disponibilidad reutilizados del catálogo. Subcategoría: `/categorias/[slug]` también (slug global único); las migas muestran Padre › Hija.
- `/marcas`: índice con logos (destacadas primero, luego A–Z).
- `/marcas/[slug]`: hero con logo, tagline, descripción, chips de categorías donde la marca tiene productos, grilla.
- `/catalogo?cat=x` (único filtro) → 308 a `/categorias/x`; `?brand=x` → `/marcas/x`.
- Sitemap, canonical propio, JSON-LD `CollectionPage` + `BreadcrumbList` (categoría) y `Brand` (marca).

**Filtros del catálogo:** casillas jerárquicas (padre marca todas sus hijas; estado indeterminado), conteos facetados reales con los estados públicos, opciones en 0 deshabilitadas; marcas con buscador y "ver más" sobre 12.

## 3. Modelo de datos

```prisma
model Category {
  // + existentes
  position   Int     @default(0)
  isVisible  Boolean @default(true)
  showInMenu Boolean @default(false) // solo aplica a raíces
  @@unique([parentId, name])          // reemplaza name @unique
  @@index([parentId, position])
}

model Brand {
  // + existentes (imageUrl = logo)
  heroUrl   String?
  position  Int     @default(0)
  isVisible Boolean @default(true)
  featured  Boolean @default(false)
  @@index([featured, position])
}
```

Migración: `showInMenu = true` para las raíces actuales (preserva el menú), `position` inicial por orden alfabético.

## 4. Administración

**/admin/categories → árbol.**
- Árbol completo (sin paginar) con sangría, chevron para expandir, línea guía.
- Columnas: nombre + slug · productos (directos / "+N en subcategorías") · visible (switch inline) · en menú (switch inline, solo raíces) · acciones (añadir subcategoría, editar, papelera).
- Arrastrar y soltar (`@dnd-kit/sortable`): reordenar hermanas y mover a otro padre; se valida ciclo y profundidad (máx. 2). Acción `reorderCategories([{id, parentId, position}])` en una transacción.
- Panel "Vista previa del menú" a la derecha: muestra lo que verá el cliente (6 raíces + "Más") y avisa de raíces sin productos.
- Selector de padre en el drawer: excluye la propia categoría y sus descendientes; solo ofrece raíces (profundidad 2).
- Borrar un padre con hijas vivas: bloqueado con mensaje ("Mueve o elimina sus 3 subcategorías primero").

**/admin/brands.**
- Lista ordenable (drag) con logo, nombre, productos, switches `Visible` y `Destacada` (aviso si hay más de 8 destacadas).
- Drawer: logo, imagen hero, tagline, descripción, vista previa de la tarjeta.

**Reglas de integridad (servidor).**
- Sin ciclos, profundidad máx. 2, padre debe existir y no estar en la papelera.
- Restaurar producto con categoría/marca en papelera: se bloquea indicando cuál restaurar primero.
- Reasignaciones validan destino vivo.
- Conteos públicos solo cuentan estados visibles del catálogo.
- Importación: celdas vacías no pisan valores; máximo 500 filas; precarga de slugs.
- Errores de Prisma (P2002, FK) traducidos a mensajes de negocio.
