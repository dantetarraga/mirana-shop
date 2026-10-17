# Auditoría Mirana Shop — 2026-10-17

Alcance: seguridad/backend (Codex), libro de reclamaciones, UI/UX (skills `frontend-design` + `web-design-guidelines`), componentes React (`vercel-react-best-practices` + `vercel-composition-patterns`), enrutado/estructura Next 16 (`next-best-practices` + `nextjs-app-router-patterns`).

Estado de checks: `pnpm typecheck` ✅ · `pnpm lint` 0 errores / 66 warnings (43 jsx-a11y, 5 exhaustive-deps) · `pnpm test` 12/12 ✅ (solo libs puras).

---

## 0. Prioridad inmediata (hacer primero)

| # | Hallazgo | Archivo | Por qué |
|---|---|---|---|
| 1 | Páginas `/admin/*` sin chequeo de rol propio: el proxy acepta cualquier sesión y solo el layout valida `role` (del JWT). Ninguna `page.tsx` ni query admin llama `requireAdmin`. | `proxy.ts:40`, `app/admin/layout.tsx:13`, `app/admin/*/page.tsx` | Los layouts no son barrera de seguridad (Partial Rendering). Un cliente registrado o un admin degradado puede recibir datos de pedidos/usuarios. Mutaciones sí protegidas. |
| 2 | Reseñas inventadas en home ("4.9 · 2,847 reseñas" + 6 testimonios hardcodeados) | `features/home/components/ReviewsSection.tsx:3-63` | Publicidad engañosa (Ley 29571, INDECOPI). Quitar o reemplazar por señales reales. |
| 3 | Libro de reclamaciones: plazo de respuesta incorrecto (30 días calendario → **15 días hábiles**, D.S. 101-2022-PCM) | `app/(storefront)/libro-de-reclamaciones/page.tsx:21`, `ComplaintBookForm.tsx:59` | Incumplimiento normativo directo. |
| 4 | Libro: no se envía constancia por correo ni la respuesta llega al consumidor (no hay infraestructura de email) | `complaint.actions.ts:91,120` | Obligatorio por reglamento. El toast "Respuesta enviada" es falso. |
| 5 | XSS persistente: el sanitizador por regex se puede evadir con etiquetas anidadas (`<<x>img …>`) | `shared/lib/rich-text.ts:68`, `LegalPageView.tsx:33` | CSP con `unsafe-inline` no lo mitiga. Usar sanitizador con parser (p.ej. `sanitize-html`). |
| 6 | Pre-apropiación de cuentas: registro sin verificar email + Google `upsert` reutiliza la cuenta con la contraseña del atacante | `register.actions.ts:45`, `auth.ts:72` | Toma de cuenta. |
| 7 | Login sin rate limit (bcrypt directo en `authorize`) y registro enumera emails | `auth.ts:22`, `register.actions.ts:38` | Fuerza bruta. |
| 8 | `seed.ts` imprime la contraseña del admin y usa un default conocido; además pisa el hash del admin existente | `prisma/seed.ts` (log "Admin credentials") | Fuga de credencial. **Rotar la contraseña del admin de producción** (salió en logs). |

---

## 1. Seguridad y backend (Codex)

Positivo: 61/61 actions admin usan `requireAdmin`; 8/8 de cuenta usan `requireUser` y filtran por usuario.

**ALTO**
- Importación de stock con read-modify-write fuera de transacción; deshace reservas concurrentes y no incrementa `version` — `product.actions.ts:357,396`. Usar `increment` atómico.
- Soft-delete de producto elimina `ProductInventory` aunque haya reservas → cancelar/confirmar pedidos omite movimientos; restaurar crea stock 0 — `product.actions.ts:255`, `stock.ts:113`.
- (ver tabla 0: XSS, pre-apropiación de cuenta, login sin rate limit, seed).

**MEDIO**
- Cupón: `usedCount` sube antes del pago y nunca baja al cancelar/expirar; sin límite por usuario — `checkout.actions.ts:335`, `expire-orders.ts:54`.
- Transiciones de pedido concurrentes (`UPDATE` solo por id) → `SHIPPED` + `REFUNDED` posible — `order.actions.ts:40,92`. Filtrar por estado previo.
- Pedidos previos a la migración con `reservationExpiresAt = NULL` nunca expiran — `20260827010000_.../migration.sql`, `expire-orders.ts:14`. Backfill en el deploy.
- Correlativos `MIR-YYYY-NNNN` y `LR-YYYY-NNNN` ordenados como texto → se rompen al pasar 9999 — `checkout.actions.ts:352`, `complaint.actions.ts:50`.
- `RATE_LIMIT_SECRET=""` no cae a `AUTH_SECRET` (`??` no ignora vacío) → todas las actions limitadas fallan — `rate-limit.ts:24`.
- Upload: el bloqueo de SVG confía en el MIME declarado — `upload.actions.ts:31`. Detectar por magic bytes / re-encodificar con sharp.

**BAJO**
- Redondeo del adelanto de preventa con float — `checkout/lib/preorder.ts:26`.
- Cron: `provided !== secret` sin `timingSafeEqual`, duplicado en 4 rutas — `app/api/cron/*/route.ts`.

## 2. Libro de Reclamaciones

Bien: zod en servidor, correlativo único con reintento, sin edición/borrado por consumidor, admin protegido, rate limit con HMAC de IP, sin XSS, nota de INDECOPI.

**CRÍTICO**: plazo 15 días hábiles; constancia por email inmediata; respuesta por email; **datos del proveedor** (razón social, RUC, domicilio) ausentes en hoja y footer → agregar a `StoreSettings`.

**ALTO**
- Respuesta sobrescribible ("Actualizar respuesta") — `ComplaintDetailDrawer.tsx:82`. Hacerla inmutable / tabla de solo inserción.
- Faltan datos de padre/apoderado para menores.
- Faltan campos Anexo I: producto vs servicio, fecha visible, nº de pedido, declaración de veracidad, "acciones adoptadas por el proveedor".
- Definiciones literales de reclamo/queja — `ComplaintBookForm.tsx:145`.
- Sin control de vencimiento en admin (dueAt, semáforo, alerta en cron).
- Sin consentimiento de datos personales (Ley 29733).

**MEDIO/BAJO**: `err.message` filtrado al cliente (`complaint.actions.ts:97,132`); aviso legal (Anexo II) e ícono del libro en footer; documentar retención ≥2 años; honeypot; labels sin `htmlFor`/ARIA (`checkout/components/ui.tsx:19`); validación de DNI/CE por tipo; año del correlativo en zona `America/Lima`; fecha del admin sin año.

## 3. Enrutado, estructura y Next.js

**ALTO**
- **Cero caché de datos**: 25 `revalidateTag` que no invalidan nada (no hay `unstable_cache` / `'use cache'`). Cada vista consulta todo a la DB — crítico con la cuota de 500 conexiones/h de Hostinger.
- `getStoreSettings()` ~10 veces por request; `getProductBySlug` / `getPublicCollectionBySlug` 2× (metadata + page). → `React.cache()` + `unstable_cache` con los tags existentes.
- Dependencia circular `auth.ts` ↔ `features/cart/lib/cart-resolve.ts` mete Prisma en el bundle del proxy → separar `auth.config.ts`.

**MEDIO**
- Pool Prisma `connectionLimit: 10` sin `idleTimeout`/`minimumIdle` — `shared/lib/db.ts:21`.
- Falta `app/global-error.tsx`; errores/404 en raíz pierden navbar/footer → `app/(storefront)/error.tsx` y `not-found.tsx`.
- `images.unoptimized: true` sin loader → Cloudinary sirve tamaño original. Usar `loaderFile` con `w_…,c_limit,f_auto,q_auto`. Quitar unsplash/picsum de `remotePatterns`/CSP en prod.
- `sitemap.ts` `force-dynamic`; falta `/libro-de-reclamaciones`.
- `shared/` importa de `features/` (10 archivos: Navbar, Footer, WhatsAppFloat, admin/*).
- Layout `(account)` sin `CartHydrator`, promo bar ni logo; sin `loading/error`. `/cuenta` sin `page.tsx` (404).

**BAJO**: canonical de catálogo con filtro de marca; `BASE_URL` cae a localhost silenciosamente → validar env con zod al arrancar; `NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY` sin uso; `getMyOrders` en `actions/` siendo lectura; `noUncheckedIndexedAccess`; tests faltantes de `requireAdmin`, proxy, cron y `placeOrder`.

## 4. Componentes React

**CRÍTICO**: sin `React.cache()` (ver §3).
- Waterfalls: `await getHideOutOfStock()` dentro de `Promise.all` — `NewArrivals.tsx:19`, `FeaturedProducts.tsx:29`, `HomeSections.tsx:17`, `RelatedProducts.tsx:22`, `colecciones/[slug]/page.tsx:24`, `catalogo/page.tsx:72`.

**ALTO**
- Imports estáticos pesados: tiptap y xlsx (~400 KB) en `ProductsClient.tsx:14-21`, `BrandsTableClient`, `CategoriesTableClient`, `LegalPagesClient`; recharts en `DashboardView.tsx`. → `next/dynamic` (como ya se hace con jspdf).
- Zustand sin selector: `ProductCard.tsx:29` (cada tarjeta re-renderiza con cualquier cambio del carrito), Navbar, CartDrawer, CartView, CheckoutView, etc. → selectores o `useShallow`.
- Sin `<Suspense>` por sección: home y `RelatedProducts` bloquean todo el HTML.
- `CheckoutView.tsx:299` pide perfil/direcciones en `useEffect` → pasar desde el server.

**MEDIO**: estado derivado en efecto (`ProductCrudDrawer.tsx:144` → usar `key`); deps inestables (`EntityProductsPanel.tsx:116`, `InventoryClient.tsx:147`); duplicados `EntityProductsPanel`/`EntityProductsDrawer` y `ExcelImportDrawer`/`EntityImportDrawer`; componentes >400 líneas (ExcelImportDrawer 667, CheckoutView 598, StoreSettingsClient 488, ProductCrudDrawer 478); `Modal.tsx` → `<dialog>` nativo.

**BAJO**: `forwardRef` en `Select.tsx` (React 19); keys por índice en `SuccessScreen.tsx:61`; barrels `shared/hooks/index.ts`; queries de bloques ocultos se ejecutan igual; `admin/products/page.tsx:74` serializa el producto entero.

## 5. UI / UX

**ALTO**
- Navbar `fixed` tapa el breadcrumb y la parte superior de la imagen en ficha y colecciones (verificado: navbar termina en 104px, breadcrumb empieza en 32px) — `catalogo/[slug]/page.tsx:159`, `colecciones/[slug]/page.tsx:96`.
- Móvil sin navegación: "Catálogo" `hidden sm:block`, sin menú; buscador truncado a "Bus" — `Navbar.tsx:203`.
- Reseñas falsas (ver §0).
- Checkout: labels no asociados, sin `autoComplete`/`inputMode`, errores sin ARIA, inputs de 14px (zoom en iOS) — `checkout/components/ui.tsx:19`, `DeliveryForm.tsx`.
- Contraste: colores hardcodeados (`#ffb84a`, `text-emerald-400`, `text-red-500`…) en vez de tokens `text-warning/success/danger`; promo bar `bg-emerald-600` fuera de paleta.
- Carrusel hero sin pausa ni `prefers-reduced-motion`; marquee duplicado para lectores y `role="banner"` extra.

**MEDIO**
- Galería (5 imágenes): sin swipe, sin teclado, sin zoom/lightbox, sin `aria-current` en miniaturas, sin precarga. En móvil el CTA queda bajo el pliegue → CTA sticky.
- ProductCard: `h-55 object-cover` recorta figuras (usar `aspect-[4/5]`); `sizes` incorrecto en 640–1024; precio tachado sin contexto para lectores; textos de 8–9px.
- Inconsistencia de ofertas ficha vs tarjeta (% y "Ahorras").
- `<Link><Button>` anidados (HTML inválido).
- Pantalla de éxito: WhatsApp debería ser el CTA dominante, código copiable, enlace al pedido.
- Promo bar causa layout shift (decidir cierre por cookie en server).
- Home móvil: ~1300px de banners antes del primer producto; sin `<h1>`.
- Touch targets < 44px; FAB de WhatsApp tapa contenido.
- Buscador `role="combobox"` sin navegación por teclado.
- Sidebar admin móvil sin `inert`/Escape.

**BAJO**: `transition-all` + `fade-up` en todo (look genérico), 84 etiquetas uppercase tracked, colores sin token, breadcrumb sin ARIA, footer con opacity .55, tarjetas serializan 5 imágenes cuando usan 1.

---

## Plan sugerido

1. **Seguridad hoy**: rol en `proxy.ts` + `verifyAdmin()` cacheado en páginas/queries admin; sanitizador HTML real; rate limit en login; quitar log de contraseña del seed y rotar la del admin.
2. **Legal esta semana**: quitar reseñas falsas; libro de reclamaciones (plazo, email de constancia y respuesta, datos del proveedor, campos Anexo I).
3. **DB/rendimiento**: `React.cache` + `unstable_cache` con tags existentes; paralelizar waterfalls; pool Prisma.
4. **UX conversión**: offset del navbar, navegación móvil, CTA sticky, campos de checkout accesibles, tokens de color.
5. **Deuda**: dynamic imports, selectores zustand, Suspense por sección, deduplicar componentes, tests de auth/cron/checkout.

---

## Estado de aplicación (2026-10-17)

Aplicado en el working tree (sin commit). Checks: `typecheck` ✅ · `lint` 0 errores (48 warnings, antes 66) · `test` 99/99 ✅ · `build` ✅ (con `NEXT_PUBLIC_SITE_URL` https).

- §0/§1 seguridad: rol admin en `proxy.ts` + `verifyAdmin()` en las 19 páginas y queries admin; `auth.config.ts` sin Prisma para el proxy; `sanitize-html`; rate limit en login; mitigación de pre-apropiación con Google; uploads por magic bytes; `cron-auth.ts` timing-safe; pool DB 5; seed sin log de contraseña ni default.
- §1 integridad: stock atómico + `version`; archivar bloqueado con reservas e inventario conservado; cupones liberados al cancelar/vencer; transiciones atómicas (409 en conflicto); correlativo numérico; expiración de pedidos legacy; adelanto en céntimos.
- §2 libro: migración `20261017230000_libro_reclamaciones_compliance`, 15 días hábiles con feriados, constancia y respuesta por email (nodemailer; Mailpit en Docker), respuesta inmutable (`ComplaintResponse`), campos Anexo I, datos del proveedor en `StoreSettings`, semáforo + alerta `COMPLAINT_DUE`.
- §3/§4 rendimiento: `React.cache` + `unstable_cache` con tags (stock con TTL 300s e invalidación `products` en checkout/pedidos/inventario), waterfalls, Suspense en home y relacionados, dynamic imports (tiptap, xlsx, recharts), image loader para Cloudinary/Unsplash, `global-error`, `env.ts` validado, sitemap con revalidate.
- §5 UI/UX: offset del navbar, menú móvil, CTA sticky, galería con swipe/teclado/lightbox, checkout accesible con autocomplete, tokens de color, motion con pausa/reduced-motion, pantalla de éxito con WhatsApp dominante, 404/error de tienda, touch targets 44px, combobox de búsqueda, reseñas falsas eliminadas.

### Pendiente (requiere acción del dueño)
1. Rotar la contraseña del admin de producción (se imprimió en logs anteriores).
2. Completar razón social, RUC y domicilio fiscal en `/admin/settings`.
3. Configurar SMTP de producción (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`).
4. Deploy: `pnpm db:migrate:deploy` en producción. Ojo: la migración backfillea `reservationExpiresAt`; los pedidos impagos de más de 1h se cancelarán en el siguiente cron.
5. `NEXT_PUBLIC_SITE_URL` debe ser https real en el build de producción (el build falla a propósito si no).
6. No resuelto: revocar JWT ya emitidos (requiere versión de token en el schema); verificación de email en registro (ya hay infraestructura de correo).
