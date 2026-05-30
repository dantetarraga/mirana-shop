# Mirana Shop — Plan de Implementación

> Documento maestro de arquitectura, diseño técnico y roadmap de ejecución para el ecommerce premium **Mirana Shop**, especializado en figuras de colección, preventas, importaciones y productos exclusivos.
>
> **Stack base:** Next.js 16 (App Router) · TypeScript · TailwindCSS v4 · Shadcn UI · Zustand · TanStack Query · React Hook Form · Zod · Prisma · PostgreSQL · Auth.js · Culqi.
>
> **Despliegue:** Hostinger (VPS recomendado) + PostgreSQL administrado.

---

## Tabla de Contenidos

1. [Visión General y Principios](#1-visión-general-y-principios)
2. [Arquitectura General](#2-arquitectura-general)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Estructura de una Feature](#4-estructura-de-una-feature)
5. [Capa `modules/` (Dominio)](#5-capa-modules-dominio)
6. [Acceso a Datos: Repositories](#6-acceso-a-datos-repositories)
7. [Sistema de Eventos Internos + Outbox Pattern](#7-sistema-de-eventos-internos--outbox-pattern)
8. [Sistema de Pagos (Provider-agnostic)](#8-sistema-de-pagos-provider-agnostic)
9. [Diseño de Base de Datos (Prisma)](#9-diseño-de-base-de-datos-prisma)
10. [Relaciones del Modelo de Datos](#10-relaciones-del-modelo-de-datos)
11. [Flujo de Pagos](#11-flujo-de-pagos)
12. [Flujo de Inventario](#12-flujo-de-inventario)
13. [Flujo de Preventas](#13-flujo-de-preventas)
14. [Estrategia de Autenticación](#14-estrategia-de-autenticación)
15. [Estrategia de Roles y RBAC](#15-estrategia-de-roles-y-rbac)
16. [Estrategia Frontend](#16-estrategia-frontend)
17. [Estrategia Backend](#17-estrategia-backend)
18. [Estrategia de Deployment (Hostinger)](#18-estrategia-de-deployment-hostinger)
19. [Riesgos Técnicos](#19-riesgos-técnicos)
20. [Escalabilidad Futura](#20-escalabilidad-futura)
21. [Roadmap de Desarrollo](#21-roadmap-de-desarrollo)
22. [Convenciones de Naming](#22-convenciones-de-naming)
23. [Estrategia de Estado Global](#23-estrategia-de-estado-global)
24. [Estrategia de Caching](#24-estrategia-de-caching)
25. [Estrategia de Error Handling](#25-estrategia-de-error-handling)
26. [Seguridad](#26-seguridad)
27. [Testing](#27-testing)
28. [Carga Masiva (CSV / XLSX)](#28-carga-masiva-csv--xlsx)
29. [Diseño UI/UX](#29-diseño-uiux)
30. [Sistema de Theming y Paleta de Colores (Tailwind v4)](#30-sistema-de-theming-y-paleta-de-colores-tailwind-v4)

---

## 1. Visión General y Principios

**Mirana Shop** es un ecommerce **híbrido**: combina pagos automáticos (Culqi: tarjetas, Yape) con pagos manuales (WhatsApp + transferencia), y soporta **inventario normal + inventario de preventa** de forma independiente.

### Principios rectores

- **Routing puro en `app/`**: las rutas solo contienen `page.tsx` y `layout.tsx`. La lógica UI de cada feature vive en `features/<feature>/`.
- **Screaming Architecture**: la estructura del repositorio "grita" lo que hace el negocio, no el framework.
- **Server-first**: Server Components y Server Actions por defecto; cliente solo cuando es estrictamente necesario (interactividad, estado local).
- **Módulos de dominio en `modules/`**: la lógica de negocio (checkout, inventory, payment, preorder) vive en módulos independientes, accesibles desde server actions, route handlers, webhooks y jobs.
- **Repositories funcionales**: cada módulo tiene `repositories/` con funciones puras que encapsulan Prisma. Sin clases, sin inyección de dependencias.
- **Event-driven interno** desde el MVP: cambios de estado importantes emiten eventos (`order.paid`, `stock.updated`) que disparan side-effects (emails, notificaciones, analytics).
- **Outbox Pattern obligatorio** para cualquier side-effect post-transacción: el evento se persiste en la **misma transacción** que el cambio de estado; un worker los procesa con retry.
- **Type-safety end-to-end**: Zod en cada frontera (server actions, route handlers, webhooks, jobs, eventos). Prisma como única fuente de verdad para tipos de DB.
- **Idempotencia y transacciones**: cualquier mutación de stock y pago debe ser idempotente y atómica.
- **Inventario separado del producto**: tabla `ProductInventory` aislada permite multi-almacén futuro sin migración dolorosa y reduce lock contention.
- **Payment Providers desacoplados**: interfaz `PaymentProvider` permite agregar Niubiz / MercadoPago / PayPal sin tocar checkout.
- **Auditoría total** de movimientos de inventario.
- **Operación simple en Hostinger**: minimizar dependencias externas (sin Redis obligatorio en MVP, sin colas externas — Outbox + `node-cron` bastan).

### KPIs técnicos objetivo

- TTFB < 300ms en home (cache ISR).
- LCP < 2.5s en mobile 4G.
- 0 sobreventas (garantía transaccional).
- 100% pagos Culqi reconciliados vía webhook idempotente.

---

## 2. Capas de la Arquitectura

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| **Routing** | Páginas y layouts exclusivamente (sin lógica ni componentes) | `app/**/page.tsx`, `app/**/layout.tsx` |
| **Feature** | Componentes, server actions, schemas, hooks y helpers por feature | `features/<feature>/` |
| **Module (Domain)** | Use cases, repositories, eventos y tipos por dominio | `modules/<domain>/` |
| **Event Bus** | Bus global de eventos tipado + handlers cross-módulo + Outbox worker | `events/` |
| **Infrastructure** | Clientes externos (Culqi, SMTP), Auth.js, proxy guards, logger | `lib/` |
| **Config** | Variables de entorno validadas + constantes globales | `config/` |
| **Shared** | UI primitives, utils, tipos cross-app, errores | `components/ui`, `shared/` |

**Reglas de dependencia (flujo unidireccional):**

```
Client Component
  → Server Action (features/<feature>/actions/)
    → Use Case (modules/<domain>/use-cases/)
      → Repository (modules/<domain>/repositories/)
        → Prisma
```

- Un Server Action **nunca** llama directamente a un repository: siempre pasa por un use case de `modules/<domain>/use-cases/`.
- Una feature **nunca** importa de otra feature (ver §3.2).
- RSC puede llamar directamente a un repository de `modules/<domain>/repositories/` para lectura simple (catálogo público).

---

## 3. Estructura de Carpetas

**Arquitectura: Routing (`app/`) + UI Features (`features/`) + Domain Modules (`modules/`) + Event Bus (`events/`).**

> **`app/`** contiene **únicamente** archivos de routing de Next.js: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`. Sin componentes, sin acciones, sin schemas.
>
> **`features/`** contiene la lógica de UI organizada por feature: componentes, server actions, schemas, hooks. Solo orquestación UI — nunca lógica de negocio directa.
>
> **`modules/`** contiene los dominios de negocio. Cada módulo es autónomo: `repositories/`, `use-cases/`, `events/`, `types/`. Accesible solo desde server (RSC, server actions, route handlers, jobs).
>
> **`events/`** contiene el bus global: tipos de eventos, `emit-event`, `dispatch-event`, handlers cross-módulo y el Outbox worker.

**Por qué esta separación:**
- `app/` = framework. `features/` = UI. `modules/` = negocio. Tres territorios sin mezcla.
- Borrar una feature UI = borrar una carpeta en `features/`. Borrar un dominio = borrar una carpeta en `modules/`.
- Los módulos no saben de React. Las features no saben de Prisma.
- Los eventos cross-módulo viven en `events/` global; los tipos de eventos propios de un módulo viven dentro del módulo.

```
mirana-shop/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── brand/
│   └── placeholders/
│
├── app/                                # ⭐ SOLO routing — page.tsx y layout.tsx
│   ├── layout.tsx
│   ├── globals.css                     # tokens Tailwind v4 (§30)
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── (storefront)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home /
│   │   ├── catalogo/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── producto/[slug]/page.tsx
│   │   ├── preventas/page.tsx
│   │   ├── carrito/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── pedido/[id]/page.tsx
│   ├── (account)/
│   │   ├── layout.tsx                  # proxy: requireAuth()
│   │   ├── perfil/page.tsx
│   │   └── pedidos/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                  # proxy: requireRole('ADMIN') + AdminShell
│   │   ├── dashboard/page.tsx
│   │   ├── productos/
│   │   │   ├── page.tsx
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── preventas/page.tsx
│   │   ├── pedidos/page.tsx
│   │   ├── inventario/page.tsx
│   │   ├── banners/page.tsx
│   │   └── importar/page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── webhooks/culqi/route.ts      # → modules/payments/use-cases/
│       ├── checkout/culqi/route.ts
│       └── admin/import/route.ts
│
├── features/                           # ⭐ UI organizada por feature (solo React)
│   ├── catalog/
│   │   ├── components/                 # CatalogGrid, CategoryFilter, SearchBar
│   │   ├── actions/                    # search-products.action.ts
│   │   ├── schemas/                    # catalog-query.schema.ts
│   │   ├── hooks/                      # useCatalogFilters.ts
│   │   └── types/
│   ├── product/
│   │   └── components/                 # Gallery, PriceBlock, AddToCartButton
│   ├── cart/
│   │   ├── components/                 # CartList, CartItemRow, CartSummary
│   │   └── hooks/                      # useCart.ts
│   ├── checkout/
│   │   ├── components/                 # CheckoutForm, ShippingFields, PaymentMethodPicker
│   │   ├── actions/                    # start-checkout.action.ts
│   │   ├── schemas/                    # checkout.schema.ts
│   │   ├── hooks/                      # useCheckoutTotals.ts
│   │   ├── types/
│   │   └── lib/                        # whatsapp-link.ts
│   ├── preorders/
│   │   └── components/                 # PreorderCard, PreorderBadge, CountdownTimer
│   ├── auth/
│   │   ├── components/                 # LoginForm, GoogleSignInButton, RegisterForm
│   │   ├── actions/                    # login.action.ts, register.action.ts
│   │   └── schemas/
│   ├── account/
│   │   ├── components/
│   │   ├── actions/
│   │   └── schemas/
│   ├── orders/
│   │   └── components/                 # OrderCard, OrderStatusBadge, OrderTimeline
│   └── admin/
│       ├── dashboard/components/       # KpiCard, RecentOrdersTable, StockAlerts
│       ├── products/
│       │   ├── components/             # ProductForm, ProductsTable
│       │   ├── actions/
│       │   └── schemas/
│       ├── inventory/
│       │   ├── components/
│       │   ├── actions/
│       │   └── schemas/
│       ├── orders/components/
│       ├── banners/
│       │   ├── components/
│       │   ├── actions/
│       │   └── schemas/
│       └── import/
│           ├── components/             # ImportDropzone, PreviewTable
│           ├── actions/
│           ├── schemas/                # row.schema.ts
│           └── lib/                   # parsers (csv, xlsx)
│
├── modules/                            # ⭐ dominio de negocio (NO se importa en cliente)
│   ├── auth/
│   │   ├── repositories/               # user.repo.ts
│   │   ├── use-cases/                  # register-user.ts, require-role.ts
│   │   └── types/
│   ├── catalog/
│   │   ├── repositories/               # product.repo.ts, category.repo.ts, brand.repo.ts
│   │   ├── use-cases/                  # get-product-by-slug.ts, list-products.ts
│   │   └── types/
│   ├── orders/
│   │   ├── repositories/               # order.repo.ts
│   │   ├── use-cases/
│   │   │   ├── place-order.ts          # crea orden + reserva stock + emite evento
│   │   │   ├── confirm-payment.ts      # marca PAID + descuenta stock + emite evento
│   │   │   └── cancel-order.ts         # cancela + libera stock + emite evento
│   │   ├── events/                     # order.created, order.paid, order.cancelled (tipos)
│   │   ├── jobs/                       # release-expired-reservations.job.ts
│   │   └── types/
│   ├── payments/
│   │   ├── repositories/               # payment.repo.ts
│   │   ├── use-cases/
│   │   │   ├── start-payment.ts
│   │   │   └── handle-culqi-webhook.ts # idempotente
│   │   ├── providers/                  # payment-provider.ts (interfaz), culqi.provider.ts, transfer.provider.ts
│   │   ├── events/                     # payment.succeeded, payment.failed (tipos)
│   │   ├── jobs/                       # reconcile-culqi-payments.job.ts
│   │   └── types/
│   ├── inventory/
│   │   ├── repositories/               # inventory.repo.ts, movement.repo.ts
│   │   ├── use-cases/
│   │   │   ├── reserve-stock.ts
│   │   │   ├── release-stock.ts
│   │   │   ├── deduct-stock.ts
│   │   │   └── adjust-stock.ts
│   │   ├── events/                     # stock.updated (tipos)
│   │   └── types/
│   ├── preorder/
│   │   ├── repositories/               # preorder.repo.ts
│   │   ├── use-cases/
│   │   │   ├── reserve-preorder.ts
│   │   │   └── convert-to-stock.ts
│   │   ├── events/                     # preorder.arrived (tipos)
│   │   ├── jobs/                       # preorder-arrival-reminders.job.ts
│   │   └── types/
│   └── notifications/
│       ├── use-cases/
│       │   ├── send-order-confirmation.ts
│       │   └── send-welcome-email.ts
│       └── templates/
│
├── events/                             # ⭐ bus global de eventos + Outbox
│   ├── event.types.ts                  # DomainEvent (unión de todos los módulos)
│   ├── emit-event.ts                   # persiste OutboxEvent en misma transacción
│   ├── dispatch-event.ts               # rutea evento → handler(s)
│   ├── handlers/                       # handlers cross-módulo
│   │   ├── order-paid.handler.ts       # → notifications + analytics
│   │   ├── order-cancelled.handler.ts  # → notifications
│   │   ├── stock-updated.handler.ts    # → alertas bajo stock
│   │   └── preorder-arrived.handler.ts # → notifications a reservantes
│   └── jobs/
│       └── process-outbox.job.ts       # worker node-cron cada 30s
│
├── components/                         # UI compartido por 2+ features
│   ├── ui/                             # primitives shadcn
│   ├── layout/                         # Navbar, Footer, Sidebar, AdminShell
│   └── shared/                         # Logo, Price, StatusBadge, ProductCard
├── hooks/                              # hooks compartidos (useDebounce, useMediaQuery)
├── stores/                             # Zustand global (estado puro cliente)
│   ├── cart.store.ts
│   └── ui.store.ts
├── providers/                          # React providers del árbol de la app
│   └── app-providers.tsx               # QueryClientProvider, SessionProvider, ThemeProvider
├── lib/                                # infraestructura cross-app
│   ├── prisma.ts                       # singleton PrismaClient
│   ├── auth.ts                         # Auth.js config
│   ├── proxy.ts                        # requireAuth / requireRole para layouts
│   ├── culqi/
│   │   ├── client.ts                   # cliente HTTP Culqi
│   │   └── verify-webhook.ts
│   ├── mailer.ts                       # cliente SMTP
│   ├── rate-limit.ts
│   ├── logger.ts
│   ├── http.ts                         # respuestas estándar
│   └── utils.ts                        # cn(), formatCurrency, slugify
├── config/                             # configuración y constantes globales
│   ├── env.ts                          # validación env con Zod
│   └── constants.ts                    # ORDER_TTL_MIN, CURRENCY, etc.
├── shared/                             # tipos y errores cross-app
│   ├── types/                          # Money (value object), PaginationParams
│   ├── schemas/                        # schemas Zod reutilizados
│   └── errors/                         # AppError, OutOfStockError, etc.
├── docs/
│   └── PLAN-IMPLEMENTATION.md
├── .env.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

> **Notas:**
> - **`app/`** solo contiene archivos de routing. Ningún componente, acción ni schema vive aquí.
> - **`features/`** es territorio React: componentes, server actions, schemas, hooks. Nunca lógica de negocio con Prisma directo.
> - **`modules/`** es territorio de dominio: sin React, sin Next.js. Solo lógica de negocio, repositorios y tipos. Next.js no lo enruta.
> - **`events/`** es el bus global: tipos de dominio unificados, `emit-event`, `dispatch-event`, handlers cross-módulo. Los tipos de eventos propios de cada módulo viven en `modules/<domain>/events/`.
> - **`providers/`** contiene los React Context providers del árbol raíz (no los providers de pago — esos están en `modules/payments/providers/`).
> - **`config/`** centraliza env vars y constantes. No mezclar con `lib/` (que es código ejecutable).
> - **No existe `middleware.ts`**: protección vía `lib/proxy.ts` en layouts.
> - **No existe `tailwind.config.ts`**: Tailwind v4 usa `@theme` en `globals.css` (ver §30).
> - **`tsconfig.json`**: `"paths": { "@/*": ["./*"] }` apunta a la raíz del proyecto.

### 3.1 Cuándo promover algo

| Situación | Acción |
|---|---|
| Componente de una sola feature | `features/<feature>/components/` |
| Componente usado en **2+ features** | `components/shared/` |
| Primitive de UI (Button, Input) | `components/ui/` (shadcn) |
| Hook de una sola feature | `features/<feature>/hooks/` |
| Hook usado en **2+ features** | `hooks/` |
| Acceso a datos Prisma | `modules/<domain>/repositories/` |
| Use case de negocio | `modules/<domain>/use-cases/` |
| Tipo de evento de un módulo | `modules/<domain>/events/` |
| Tipo de evento cross-módulo | `events/event.types.ts` |
| Tipo de dominio cruzado (`Money`) | `shared/types/` |
| Util puro (`formatCurrency`) | `lib/utils.ts` |
| Schema Zod reutilizado | `shared/schemas/` |
| Constante global (`ORDER_TTL_MIN`) | `config/constants.ts` |
| Variable de entorno | `config/env.ts` |
| Store Zustand global | `stores/` |

**Antipatrón:** poner lógica de negocio en `features/<feature>/actions/` con Prisma inline. Las server actions de feature solo validan input y llaman a un use case de `modules/<domain>/use-cases/`.

### 3.2 Reglas de imports

- **`app/`** solo importa de `features/`, `components/`, `lib/`, `stores/`, `providers/`.
- **`features/`** importa de `components/`, `hooks/`, `stores/`, `lib/`, `config/`, `shared/`. Nunca de `modules/` directamente desde Client Components.
- **`modules/`** importa de `lib/`, `config/`, `shared/`, `events/`. Nunca de `features/`, `app/`, `components/`, `stores/`.
- **`events/`** importa de `modules/` (para tipos) y `lib/`. Nunca de `features/` ni `app/`.
- **Prohibido** que una feature importe de otra feature. Lógica compartida → `components/shared/` (UI) o `modules/` (dominio).
- Path alias: `@/*` apunta a la raíz del proyecto (`"paths": { "@/*": ["./*"] }`).

---

## 4. Estructura de una Feature

Una **feature** = una carpeta en `features/` con subcarpetas planas. Contiene **solo orquestación UI**: React, Server Actions delgadas, schemas de formulario. Nunca lógica de negocio ni Prisma.

```
features/<feature>/
├── components/            # RSC + Client Components
├── actions/               # Server Actions ("use server") — validan + llaman use case
├── schemas/               # Zod (validación de formularios e inputs)
├── hooks/                 # Client hooks (TanStack Query, selectores de stores)
├── types/                 # tipos UI de la feature
└── lib/                   # helpers UI exclusivos (ej. whatsapp-link.ts)
```

No hay `services/` ni `repositories/` en features: esa lógica vive en `modules/<domain>/use-cases/` y `modules/<domain>/repositories/` respectivamente.

Las `page.tsx` en `app/` importan desde la feature y agregan el fetch inicial:

```tsx
// app/(auth)/registro/page.tsx
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';

export default function Page() {
  return (
    <div className="...">
      <RegisterForm />
      <GoogleSignInButton />
    </div>
  );
}
```

### 4.1 Ejemplo: feature `features/auth/`

```
features/auth/
├── components/
│   ├── RegisterForm.tsx           # "use client"
│   ├── LoginForm.tsx              # "use client"
│   └── GoogleSignInButton.tsx     # "use client"
├── actions/
│   ├── register.action.ts         # "use server" — valida + llama use case
│   └── login.action.ts
└── schemas/
    ├── register.schema.ts
    └── login.schema.ts
```

Dominio en `modules/auth/`:

```
modules/auth/
├── repositories/
│   └── user.repo.ts               # findByEmail, create, findById
├── use-cases/
│   ├── register-user.ts           # reglas: email único, hash, emit user.registered
│   └── require-role.ts            # guard reutilizable (usado por lib/proxy.ts)
└── types/
```

Flujo de datos:

```
RegisterForm.tsx (client)
  → register.action.ts (valida con register.schema)
    → modules/auth/use-cases/register-user.ts
      → modules/auth/repositories/user.repo.ts → Prisma → PostgreSQL
      → events/emit-event.ts → OutboxEvent (misma tx)
```

### 4.2 Ejemplo: feature `features/checkout/`

- `schemas/checkout.schema.ts`: validación de shipping, items, método.
- `actions/start-checkout.action.ts`: valida → llama a `modules/orders/use-cases/place-order.ts`.
- `components/CheckoutForm.tsx` (client), `OrderSummary.tsx` (RSC).
- `hooks/useCheckoutTotals.ts`: cálculo reactivo en el form.
- `lib/whatsapp-link.ts`: builder del deep link `wa.me/...`.

La `page.tsx` solo ensambla:

```tsx
// app/(storefront)/checkout/page.tsx
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm';
import { OrderSummary } from '@/features/checkout/components/OrderSummary';

export default function Page() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <CheckoutForm />
      <OrderSummary />
    </div>
  );
}
```

Dominio en `modules/orders/`:

- `use-cases/place-order.ts`: crea orden `PENDING` en transacción, llama a `modules/inventory/use-cases/reserve-stock.ts`, emite `order.created`.
- `use-cases/confirm-payment.ts`: marca `PAID`, llama a `modules/inventory/use-cases/deduct-stock.ts`, emite `order.paid`. Reutilizado por webhook Culqi y validación manual del admin.

### 4.3 Convención de archivos

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Componente | `PascalCase.tsx` | `ProductForm.tsx` |
| Hook | `useCamelCase.ts` | `useCart.ts` |
| Server Action | `verb-noun.action.ts` | `start-checkout.action.ts` |
| Use case | `verb-noun.ts` | `place-order.ts`, `confirm-payment.ts` |
| Repository | `entity.repo.ts` | `order.repo.ts`, `product.repo.ts` |
| Payment provider | `name.provider.ts` | `culqi.provider.ts` |
| Event handler | `event-name.handler.ts` | `order-paid.handler.ts` |
| Job (cron) | `verb-noun.job.ts` | `process-outbox.job.ts` |
| Schema Zod | `entity.schema.ts` | `checkout.schema.ts` |
| Tipos | `entity.types.ts` | `order.types.ts` |

---

## 5. Capa `modules/` (Dominio)

### 5.1 Por qué existe

Los use cases de negocio (`place-order`, `confirm-payment`, `reserve-stock`) son **llamados desde múltiples puntos de entrada**:

| Use case | Llamado por |
|---|---|
| `confirm-payment` | webhook Culqi, admin (validación manual), cron de reconciliación |
| `reserve-stock` | server action checkout, server action admin (orden manual) |
| `release-stock` | cron TTL, server action admin (cancelar), webhook `charge.failed` |
| `register-user` | server action `/registro`, server action admin (crear usuario) |

Vivir en `modules/` los hace accesibles desde cualquier entry point server (RSC, server action, route handler, job) sin romper ninguna regla de imports.

### 5.2 Estructura interna de un módulo

```
modules/<domain>/
├── repositories/      # acceso a datos Prisma (solo lectura/escritura, sin reglas)
├── use-cases/         # lógica de negocio: una función = una acción
├── events/            # tipos de eventos propios del módulo
├── jobs/              # workers cron del módulo (si aplica)
├── providers/         # adapters externos del módulo (ej. culqi.provider.ts en payments)
└── types/             # tipos de dominio
```

### 5.3 Reglas

- **Funciones puras** (no clases, no inyección de dependencias). Prisma se importa directamente desde `lib/prisma.ts`.
- **Validan input con Zod** en la frontera si el dato viene de webhook, job o external.
- **Lanzan `AppError` tipados** — nunca `throw new Error('mensaje')`.
- **Emiten eventos** vía `events/emit-event.ts` dentro de la misma transacción. Jamás envían emails inline.
- **Nunca** importan de `app/`, `features/`, `components/`, `hooks/`, `stores/`.

### 5.4 Módulos y responsabilidades

| Módulo | Responsabilidad |
|---|---|
| `modules/auth/` | Registro, hash de password, guard `requireRole` |
| `modules/catalog/` | Lectura de productos, categorías, marcas |
| `modules/orders/` | Crear orden, confirmar pago, cancelar orden |
| `modules/payments/` | Providers de pago + webhook handler + reconciliación |
| `modules/inventory/` | Reservar, liberar, descontar, ajustar stock (operaciones atómicas) |
| `modules/preorder/` | Reservar preventa, convertir a stock al llegar |
| `modules/notifications/` | Envío de emails transaccionales + templates |

---

## 6. Acceso a Datos: Repositories

### 6.1 Decisión

Cada módulo tiene su carpeta `repositories/` con **funciones puras** (no clases) agrupadas por entidad. Un repository es el único lugar que habla con Prisma directamente — los use cases no tocan Prisma salvo para abrir transacciones.

```
modules/<domain>/repositories/
└── entity.repo.ts    # todas las operaciones de lectura y escritura de esa entidad
```

**Por qué funciones y no clases:**
- Next.js con Server Actions es funcional por naturaleza. Sin constructor, sin `new`, sin DI.
- Tree-shaking: solo se importa lo que se usa.
- Testeable: se puede mockear la función individual sin instanciar nada.

### 6.2 Reglas

- **Sin reglas de negocio** en repositories. Solo `findUnique`, `findMany`, `create`, `update`, `delete`. Si hay una condición de negocio ("si stock < 5 alertar") → eso va en el use case.
- **No exponen Prisma directamente**: devuelven tipos tipados (`Product`, `Order`, etc. o DTOs propios).
- **Aceptan `tx`** como parámetro opcional para participar en transacciones abiertas por el use case.
- **Son testeables** con DB de test real (Vitest + Testcontainers). No mockear Prisma.

### 6.3 Ejemplo

```ts
// modules/catalog/repositories/product.repo.ts
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: { images: true, brand: true, inventory: true },
  });
}

export async function listFeaturedProducts(limit = 12) {
  return prisma.product.findMany({
    where: { featured: true, status: 'AVAILABLE', deletedAt: null },
    include: { images: { take: 1, orderBy: { position: 'asc' } } },
    take: limit,
  });
}

export async function createProduct(
  data: Prisma.ProductCreateInput,
  tx?: Prisma.TransactionClient,
) {
  return (tx ?? prisma).product.create({ data });
}

export async function softDeleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
}
```

### 6.4 Quién llama a qué

| Caller | Puede llamar |
|---|---|
| RSC (lectura pública) | repository directo (`getProductBySlug`, `listFeaturedProducts`) |
| Server Action | use case en `modules/<domain>/use-cases/` |
| Route Handler (webhook) | use case en `modules/<domain>/use-cases/` |
| Job (cron) | use case en `modules/<domain>/use-cases/` |
| Use case | repositories del mismo módulo + use cases de otros módulos |

**Prohibido**: Server Action que abra `prisma.$transaction` con lógica inline. Si hay transacción → es un use case → vive en `modules/<domain>/use-cases/`.

---

## 7. Sistema de Eventos Internos + Outbox Pattern

### 7.1 Por qué desde el MVP

Sin eventos + Outbox, cualquier side-effect post-transacción es frágil:

- Pago confirmado → ¿el email se envió? Si SMTP falló, el cliente nunca lo recibe.
- Stock cambiado → ¿el job de alertas se enteró?
- Preventa llegó → ¿se notificó a los reservantes?

La solución: **el evento se persiste en la misma transacción que el cambio de estado**, y un worker lo procesa después con retry. Cero pérdidas.

No requiere Redis ni BullMQ: una tabla `OutboxEvent` + `node-cron` cada 30s.

### 7.2 Bus de eventos tipado

```ts
// events/event.types.ts
export type DomainEvent =
  | { type: 'order.created'; payload: { orderId: string } }
  | { type: 'order.paid'; payload: { orderId: string; method: PaymentMethod } }
  | { type: 'order.cancelled'; payload: { orderId: string; reason: string } }
  | { type: 'stock.updated'; payload: { productId: string; delta: number } }
  | { type: 'preorder.arrived'; payload: { productId: string } }
  | { type: 'user.registered'; payload: { userId: string } };

export type EventType = DomainEvent['type'];
```

### 7.3 Emisión (dentro de transacción)

```ts
// events/emit-event.ts
import type { Prisma } from '@prisma/client';
import type { DomainEvent } from './event.types';
import { createId } from '@/lib/utils';

export async function emitEvent(
  tx: Prisma.TransactionClient,
  event: DomainEvent,
  idempotencyKey?: string,
) {
  await tx.outboxEvent.create({
    data: {
      type: event.type,
      payload: event.payload as Prisma.JsonObject,
      idempotencyKey: idempotencyKey ?? createId(),
      attempts: 0,
      processed: false,
    },
  });
}
```

Uso:

```ts
// modules/orders/use-cases/confirm-payment.ts
await prisma.$transaction(async (tx) => {
  await tx.order.update({ where: { id }, data: { status: 'PAID', paymentStatus: 'PAID' } });
  await deductStockInTx(tx, items);
  await emitEvent(tx, { type: 'order.paid', payload: { orderId: id, method } }, `pay:${id}`);
});
```

### 7.4 Worker (Outbox processor)

```ts
// events/jobs/process-outbox.job.ts
export async function processOutbox() {
  const events = await prisma.outboxEvent.findMany({
    where: { processed: false, nextAttemptAt: { lte: new Date() } },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });
  for (const evt of events) {
    try {
      await dispatchEvent(evt);
      await prisma.outboxEvent.update({
        where: { id: evt.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (err) {
      const attempts = evt.attempts + 1;
      const backoffMs = Math.min(60_000 * 2 ** attempts, 3_600_000); // máx 1h
      await prisma.outboxEvent.update({
        where: { id: evt.id },
        data: {
          attempts,
          lastError: String(err),
          nextAttemptAt: new Date(Date.now() + backoffMs),
        },
      });
    }
  }
}
```

### 7.5 Handlers

```
events/handlers/
├── order-paid.handler.ts          → modules/notifications/ + analytics
├── order-cancelled.handler.ts     → modules/notifications/
├── stock-updated.handler.ts       → alerta bajo stock (admin)
├── preorder-arrived.handler.ts    → modules/notifications/ a todos los reservantes
└── user-registered.handler.ts     → modules/notifications/ bienvenida
```

`dispatchEvent` mapea `event.type` → handler(s). Un evento puede tener múltiples handlers.

### 7.6 Reglas

- **Idempotencia** obligatoria en handlers: pueden ejecutarse 2 veces.
- **No bloquear** la transacción del caller: el handler corre **después** vía cron.
- **`idempotencyKey`** evita duplicar el mismo evento (ej. webhook Culqi reenviado).
- **Retry exponencial** con tope (1h). Tras N fallos, marcar `dead` y alertar admin.

---

## 8. Sistema de Pagos (Provider-agnostic)

### 8.1 Contrato

```ts
// modules/payments/providers/payment-provider.ts
export interface PaymentProvider {
  readonly id: PaymentMethod;

  /** Inicia el cobro. Devuelve datos para el cliente (token, URL, deep link). */
  charge(input: ChargeInput): Promise<ChargeResult>;

  /** Verifica y procesa un webhook entrante. Idempotente. */
  handleWebhook(req: Request): Promise<WebhookResult>;

  /** Reembolso total o parcial. */
  refund(input: RefundInput): Promise<RefundResult>;
}
```

### 8.2 Implementaciones MVP

```
modules/payments/providers/
├── payment-provider.ts          # interfaz PaymentProvider
├── culqi.provider.ts            # Culqi (tarjetas + Yape)
└── transfer.provider.ts         # WhatsApp + transferencia bancaria (manual)
```

### 8.3 Orquestador de providers

`start-payment.ts` en `modules/payments/use-cases/` recibe `PaymentMethod` y selecciona el provider. Checkout **no conoce** Culqi directamente:

```ts
// modules/payments/use-cases/start-payment.ts
const providers: Record<PaymentMethod, PaymentProvider> = {
  CULQI_CARD: culqiProvider,
  CULQI_YAPE: culqiProvider,
  WHATSAPP_TRANSFER: transferProvider,
};

export async function startPayment(orderId: string, method: PaymentMethod) {
  return providers[method].charge({ orderId });
}
```

### 8.4 Beneficio

Agregar Niubiz, MercadoPago, Izipay o PayPal = **crear un archivo** `niubiz.provider.ts` y registrarlo en el record. Checkout, server actions, webhooks no cambian.

---

## 9. Diseño de Base de Datos (Prisma)

### 9.1 `schema.prisma` (modelos mínimos)

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CUSTOMER
  ADMIN
}

enum ProductStatus {
  AVAILABLE
  PREORDER
  SOLD_OUT
  COMING_SOON
  ARCHIVED
}

enum OrderStatus {
  PENDING        // creada, sin pago confirmado
  AWAITING_PROOF // manual: esperando comprobante
  PAID           // pago confirmado (auto o manual)
  PREPARING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  UNPAID
  PROCESSING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CULQI_CARD
  CULQI_YAPE
  WHATSAPP_TRANSFER
}

enum InventoryMovementType {
  PURCHASE        // restock (entrada)
  SALE            // venta confirmada (salida)
  ADJUSTMENT      // ajuste manual admin
  PREORDER_HOLD   // reserva preventa
  PREORDER_RELEASE
  RETURN
}

enum InventoryStockType {
  NORMAL
  PREORDER
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String?
  image         String?
  role          Role      @default(CUSTOMER)
  profile       Profile?
  accounts      Account[]
  sessions      Session[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([role])
  @@index([deletedAt])
}

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone     String?
  address   String?
  district  String?
  reference String?
  city      String?
  country   String   @default("PE")
  updatedAt DateTime @updatedAt
}

// Auth.js (Account/Session/VerificationToken) — esquema estándar
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  parentId  String?
  parent    Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]
  createdAt DateTime  @default(now())
  deletedAt DateTime?

  @@index([slug])
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  logoUrl   String?
  products  Product[]
  createdAt DateTime  @default(now())
  deletedAt DateTime?

  @@index([slug])
}

model Product {
  id              String         @id @default(cuid())
  sku             String         @unique
  slug            String         @unique
  name            String
  description     String         @db.Text
  price           Decimal        @db.Decimal(10, 2)
  compareAtPrice  Decimal?       @db.Decimal(10, 2)
  currency        String         @default("PEN")
  status          ProductStatus  @default(AVAILABLE)
  featured        Boolean        @default(false)
  categoryId      String
  brandId         String
  category        Category       @relation(fields: [categoryId], references: [id])
  brand           Brand          @relation(fields: [brandId], references: [id])
  images          ProductImage[]
  inventory       ProductInventory?
  preorder        Preorder?
  orderItems      OrderItem[]
  movements       InventoryMovement[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?

  @@index([status, featured])
  @@index([categoryId])
  @@index([brandId])
  @@index([slug])
  @@index([deletedAt])
}

/// Inventario separado del producto:
/// - Habilita multi-almacén futuro sin migración dolorosa.
/// - Reduce lock contention en Product (cada venta no hace UPDATE sobre el row de producto).
/// - `version` permite optimistic locking sin SELECT FOR UPDATE.
model ProductInventory {
  id              String   @id @default(cuid())
  productId       String   @unique
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  availableStock  Int      @default(0)  // stock físico disponible
  reservedStock   Int      @default(0)  // reservado por órdenes PENDING
  preorderStock   Int      @default(0)  // cupos de preventa
  lowStockThreshold Int?                // alerta opcional por producto
  version         Int      @default(0)  // optimistic locking
  updatedAt       DateTime @updatedAt

  @@index([availableStock])
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  url       String
  alt       String?
  position  Int      @default(0)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, position])
}

model Preorder {
  id             String   @id @default(cuid())
  productId      String   @unique
  product        Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  estimatedArrival DateTime
  minReservation Int      @default(1)
  depositPercent Int      @default(50) // % adelanto
  notes          String?  @db.Text
  closesAt       DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([estimatedArrival])
}

model Order {
  id              String         @id @default(cuid())
  code            String         @unique // legible: MIR-000123
  userId          String?
  user            User?          @relation(fields: [userId], references: [id])
  guestEmail      String?
  status          OrderStatus    @default(PENDING)
  paymentStatus   PaymentStatus  @default(UNPAID)
  paymentMethod   PaymentMethod
  subtotal        Decimal        @db.Decimal(10, 2)
  shippingCost    Decimal        @default(0) @db.Decimal(10, 2)
  total           Decimal        @db.Decimal(10, 2)
  currency        String         @default("PEN")
  isPreorder      Boolean        @default(false)
  items           OrderItem[]
  payment         Payment?
  shipping        ShippingAddress?
  notes           String?        @db.Text
  movements       InventoryMovement[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  paidAt          DateTime?
  cancelledAt     DateTime?

  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
}

model OrderItem {
  id           String   @id @default(cuid())
  orderId      String
  productId    String
  quantity     Int
  unitPrice    Decimal  @db.Decimal(10, 2)
  isPreorder   Boolean  @default(false)
  productName  String   // snapshot
  productSku   String   // snapshot
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product      Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

model Payment {
  id             String         @id @default(cuid())
  orderId        String         @unique
  order          Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  method         PaymentMethod
  status         PaymentStatus  @default(UNPAID)
  amount         Decimal        @db.Decimal(10, 2)
  currency       String         @default("PEN")
  culqiChargeId  String?        @unique
  culqiEventId   String?        @unique // idempotencia webhook
  proofUrl       String?        // comprobante manual
  rawResponse    Json?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model ShippingAddress {
  id        String   @id @default(cuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fullName  String
  phone     String
  address   String
  district  String
  city      String   @default("Lima")
  reference String?
}

model InventoryMovement {
  id          String                @id @default(cuid())
  productId   String
  product     Product               @relation(fields: [productId], references: [id])
  orderId     String?
  order       Order?                @relation(fields: [orderId], references: [id])
  type        InventoryMovementType
  stockType   InventoryStockType    @default(NORMAL)
  quantity    Int                   // positivo entrada, negativo salida
  balanceAfter Int                  // snapshot stock tras movimiento
  reason      String?
  createdById String?
  createdAt   DateTime              @default(now())

  @@index([productId, createdAt])
  @@index([type])
  @@index([orderId])
}

model Banner {
  id         String   @id @default(cuid())
  title      String
  subtitle   String?
  imageUrl   String
  ctaLabel   String?
  ctaHref    String?
  position   Int      @default(0)
  active     Boolean  @default(true)
  startsAt   DateTime?
  endsAt     DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([active, position])
}

/// Outbox Pattern: garantiza atomicidad entre cambios de estado y side-effects.
/// Cualquier evento de dominio se persiste aquí en la MISMA transacción
/// que el cambio que lo origina. Un worker (node-cron) los procesa con retry.
model OutboxEvent {
  id             String    @id @default(cuid())
  type           String    // 'order.paid', 'stock.updated', etc.
  payload        Json
  idempotencyKey String    @unique
  processed      Boolean   @default(false)
  attempts       Int       @default(0)
  lastError      String?   @db.Text
  nextAttemptAt  DateTime  @default(now())
  processedAt    DateTime?
  createdAt      DateTime  @default(now())

  @@index([processed, nextAttemptAt])
  @@index([type])
}
```

### 9.2 Decisiones clave

- **Decimal(10,2)** para todo monto (nunca `Float`). Internamente se manipulan con un value object `Money` (`shared/types/money.ts`) para evitar mezclar `Decimal` con `number`.
- **Inventario separado** (`ProductInventory`): aisla stock del producto, habilita multi-almacén futuro y reduce lock contention.
- **`ProductInventory.version`**: optimistic locking para detectar escrituras concurrentes sin `SELECT FOR UPDATE`.
- **`ProductInventory.reservedStock`** evita carreras: al crear orden `PENDING` se incrementa; al pagar, se descuenta de `availableStock`; al cancelar/expirar, se libera.
- **`Payment.culqiEventId @unique`**: garantiza idempotencia del webhook.
- **Snapshots** (`productName`, `productSku`, `unitPrice`) en `OrderItem` para histórico inmutable.
- **Soft delete** con `deletedAt` en entidades de catálogo y users.
- **`InventoryMovement.balanceAfter`** facilita auditoría sin recalcular.
- **`Order.code`** legible (`MIR-000123`) generado por secuencia, separado del `id` (cuid) — UX clave para soporte.
- **`OutboxEvent`**: garantiza que ningún side-effect post-transacción se pierda (ver §7).

---

## 10. Relaciones del Modelo de Datos

`User` → `Profile`, `Order[]`, `Account[]` · `Category` → `Product[]` (tree) · `Brand` → `Product[]` · `Product` → `ProductImage[]`, `ProductInventory`, `Preorder`, `OrderItem[]`, `InventoryMovement[]` · `Order` → `OrderItem[]`, `Payment`, `ShippingAddress`, `InventoryMovement[]` · `OutboxEvent` referencia IDs por payload.

---

## 11. Flujo de Pagos

### 11.1 Flujo Automático (Culqi)

1. `POST /checkout` → `place-order` (TX: orden PENDING + reserve-stock + emit `order.created`)
2. Redirect a Culqi Checkout → usuario paga con tarjeta o Yape
3. `POST /api/checkout/culqi` → `culqi.provider.charge()` → `Payment(PROCESSING)`
4. Webhook `charge.succeeded` → `handle-culqi-webhook` (verifica firma + `culqiEventId` único)
5. TX: `confirm-payment` + `deduct-stock` + `InventoryMovement(SALE)` + emit `order.paid`
6. Outbox worker → email confirmación al cliente

**Reglas:**
- Stock real **solo** se descuenta al recibir webhook `charge.succeeded` verificado.
- El email **no** se envía inline en el webhook: se emite `order.paid` al Outbox y el worker lo procesa con retry.
- Si webhook falla → cron `reconcile-culqi-payments.job` cada 5 min consulta Culqi por órdenes `PROCESSING > 10 min`.
- Si `charge.failed` → `release-stock`, `Order.status='CANCELLED'`, emite `order.cancelled`.
- TTL de orden `PENDING` sin pago: 30 min → job `release-expired-reservations` libera reserva.

### 11.2 Flujo Manual (WhatsApp + Transferencia)

1. Checkout con método WhatsApp → `place-order` (orden PENDING + AWAITING_PROOF + reserve-stock)
2. Cliente recibe deep link `wa.me/...?text=<código orden>` y envía comprobante
3. Admin valida en panel → `confirm-payment` + `deduct-stock` + emit `order.paid`
4. Outbox worker → confirmación al cliente

> Tanto el webhook automático como la validación manual del admin llaman al **mismo** use case `modules/orders/use-cases/confirm-payment.ts`. Cero duplicación.

---

## 12. Flujo de Inventario

### 12.1 Modelo de stock

El inventario vive en `ProductInventory` (no en `Product`):

| Campo | Significado |
|---|---|
| `availableStock` | Unidades físicas disponibles **ahora** |
| `preorderStock` | Cupos de preventa (cuando el producto está en estado `PREORDER`) |
| `reservedStock` | Reservado por órdenes `PENDING` aún no pagadas |
| `version` | Optimistic locking |

**Disponible real** = `availableStock - reservedStock`.
**Disponible preventa** = `preorderStock - reservasPreventa`.

### 12.2 Transacciones críticas

Toda operación que toque stock se ejecuta vía use cases en `modules/inventory/use-cases/` dentro de `prisma.$transaction(...)`:

1. `update` con guard optimista `where: { productId, availableStock: { gte: qty }, version: currentVersion }`.
2. Incrementa `version` en la misma escritura.
3. Si `count === 0` → lanzar `OutOfStockError` (rollback automático).
4. Insertar `InventoryMovement` con `balanceAfter`.
5. `emitEvent(tx, 'stock.updated', ...)` para alertas.

```ts
// modules/inventory/use-cases/deduct-stock.ts (pseudo)
export async function deductStock(
  tx: Prisma.TransactionClient,
  productId: string,
  qty: number,
  orderId: string,
) {
  const inv = await tx.productInventory.findUniqueOrThrow({ where: { productId } });
  const updated = await tx.productInventory.updateMany({
    where: {
      productId,
      availableStock: { gte: qty },
      reservedStock: { gte: qty },
      version: inv.version,
    },
    data: {
      availableStock: { decrement: qty },
      reservedStock: { decrement: qty },
      version: { increment: 1 },
    },
  });
  if (updated.count === 0) throw new OutOfStockError('STOCK_INSUFFICIENT', 'Stock insuficiente');
  await tx.inventoryMovement.create({
    data: {
      productId, type: 'SALE', stockType: 'NORMAL',
      quantity: -qty, balanceAfter: inv.availableStock - qty,
      orderId,
    },
  });
  await emitEvent(tx, { type: 'stock.updated', payload: { productId, delta: -qty } });
}
```

### 12.3 Operaciones admin

Use cases en `modules/inventory/use-cases/`:

- **`adjust-stock.ts`** (`ADJUSTMENT`): requiere `reason` obligatorio.
- **`restock.ts`** (`PURCHASE`): suma stock + movimiento.
- **Validación manual WhatsApp**: llama a `deduct-stock` con flag.
- **Alertas bajo stock**: `stock-updated.handler.ts` consulta `lowStockThreshold` y emite notificación admin si aplica.

---

## 13. Flujo de Preventas

1. Admin crea producto `status=PREORDER` + `Preorder` + `ProductInventory.preorderStock`
2. Cliente reserva → orden `isPreorder=true`, `reservedStock += qty` de `preorderStock`
3. Pago adelanto (Culqi o transferencia) → orden `PAID` parcialmente con `isDepositPaid`
4. Producto llega → `convert-to-stock`: `preorderStock → availableStock` + emit `preorder.arrived`
5. Cobro saldo pendiente → envío → `DELIVERED`

**Reglas:**
- `Preorder.minReservation` valida cantidad mínima por orden.
- `Preorder.closesAt` cierra reservas (UI muestra countdown).
- Producto preventa se marca claramente con badge "PREVENTA · Llegada estimada DD/MM".
- Al emitir `preorder.arrived`, el handler envía email a **todos** los reservantes (consulta órdenes con `isPreorder=true` para ese productId).

---

## 14. Estrategia de Autenticación

**Auth.js v5 (NextAuth)** con `PrismaAdapter`.

- **Providers:**
  - `Google` OAuth (clientId/secret en env).
  - `Credentials` (email + password, hash `argon2` o `bcrypt` ≥12 rounds).
- **Estrategia de sesión:** `database` (tabla `Session`) → permite revocación.
- **Cookies:** `httpOnly`, `secure`, `sameSite=lax`.
- **Verificación email:** opcional MVP, obligatoria post-MVP vía `VerificationToken` + SMTP Hostinger.
- **Recuperación contraseña:** token de un solo uso (15 min) por email.
- **Helper server:** `auth()` retorna sesión tipada con `role`.

```ts
// lib/auth.ts (shape)
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [Google({...}), Credentials({...})],
  callbacks: {
    session: ({ session, user }) => ({ ...session, user: { ...session.user, id: user.id, role: user.role } }),
  },
});
```

---

## 15. Estrategia de Roles y RBAC

- Enum `Role` (`CUSTOMER`, `ADMIN`) en DB.
- **Sin `middleware.ts`**: la protección de rutas se hace en los `layout.tsx` de cada grupo vía `lib/proxy.ts`. Esto habilita Node.js runtime completo (acceso a Prisma, lógica compleja) sin las restricciones del edge runtime.

```ts
// lib/proxy.ts
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

export async function requireAuth() {
  const session = await auth();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role) redirect('/');
  return session;
}
```

Uso en layouts:

```tsx
// app/(admin)/layout.tsx
import { requireRole } from '@/lib/proxy';
import { AdminShell } from '@/components/layout/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('ADMIN');
  return <AdminShell>{children}</AdminShell>;
}

// app/(account)/layout.tsx
import { requireAuth } from '@/lib/proxy';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
```

- **Helper** `requireRole(role)` en `modules/auth/use-cases/require-role.ts` — invocado **también** en Server Actions y Route Handlers (defense in depth).
- **Use cases admin** (`modules/<domain>/use-cases/`) verifican rol antes de cualquier mutación.
- **Rate limit** aplicado a `/api/*` (route handlers) y Server Actions sensibles (login, registro, checkout) vía `lib/rate-limit.ts`.
- Futuro: granular permissions (`product:write`, `inventory:adjust`) en tabla `Permission`.

---

## 16. Estrategia Frontend

- **App Router + RSC por defecto.** Client Components solo para: carrito, filtros interactivos, forms, checkout.
- **Shadcn UI** instalado con CLI; primitives en `components/ui`.
- **TailwindCSS v4** con configuración **CSS-first** vía `@theme` en `globals.css` (sin `tailwind.config.ts`). Toda la paleta y tipografía se definen como **CSS variables OKLCH centralizadas** — ver [sección 30](#30-sistema-de-theming-y-paleta-de-colores-tailwind-v4). Cambiar un color del proyecto = editar **una sola variable**.
- **Tema oscuro premium** por defecto, modo claro opcional vía `@custom-variant dark`.
- **Fuentes:** `next/font` con una display (e.g. Space Grotesk / Sora) + sans (Inter).
- **Iconografía:** Lucide.
- **Animaciones:** Framer Motion en hero, transiciones de página vía `view-transition` API.
- **Forms:** React Hook Form + Zod resolver.
- **Data fetching cliente:** TanStack Query (solo donde se requiere refetch reactivo, e.g. admin tables, búsquedas).
- **Server data:** directo en RSC llamando a repositorios de `modules/<domain>/repositories/` (`unstable_cache` o `revalidateTag`).
- **Estado global cliente:** Zustand en `stores/` (solo `cart.store` y `ui.store`). **Nunca** server state en stores cliente.
- **Imágenes:** `next/image` con `remotePatterns` configurados (URLs externas permitidas para banners y productos).

---

## 17. Estrategia Backend

- **Server Actions finos** en `features/<feature>/actions/` para mutaciones del propio dominio: validan input con Zod y delegan a `modules/<domain>/use-cases/`.
- **Route Handlers** para integraciones externas (delegan a use cases también):
  - `/api/webhooks/culqi` → `modules/payments/use-cases/handle-culqi-webhook.ts` (firma + idempotencia).
  - `/api/checkout/culqi` → `modules/payments/use-cases/start-payment.ts`.
  - `/api/admin/import` → use case de importación.
- **Prisma singleton** con guard para dev (HMR).
- **Edge Runtime** solo en rutas estáticas. Webhooks, Prisma, jobs, proxy guards → **Node runtime**.
- **Validación Zod** en cada borde: Server Action, Route Handler, webhook payload, job payload, evento Outbox al deserializar.
- **Respuestas estándar**: `{ ok: true, data } | { ok: false, error: { code, message } }`.
- **Logging** estructurado (`pino`) → archivo en VPS, rotado.
- **Background jobs** (`node-cron` en el mismo proceso Node, gestionado por PM2):
  - `process-outbox.job` — cada 30s, procesa eventos pendientes con retry exponencial.
  - `release-expired-reservations.job` — cada 5 min, libera órdenes `PENDING > 30 min`.
  - `reconcile-culqi-payments.job` — cada 5 min, consulta Culqi por órdenes `PROCESSING > 10 min`.
  - `preorder-arrival-reminders.job` — diario, notifica preventas cercanas a llegada.
- **Solo una instancia ejecuta cron** (PM2: `instance_var` o flag `JOBS_ENABLED=true` en una sola instancia del cluster).

---

## 18. Estrategia de Deployment (Hostinger)

### 18.1 Recomendación: Hostinger VPS (KVM)

Shared hosting **no** soporta Node persistente; se requiere VPS.

**Stack VPS:**
- Ubuntu 22.04 LTS.
- Node 20 LTS + `pnpm`.
- PostgreSQL 16 (en mismo VPS o Hostinger DB).
- **PM2** para gestionar `next start` con `cluster mode`.
- **Nginx** como reverse proxy + TLS (Let's Encrypt vía Certbot).
- Firewall: UFW (22, 80, 443).

### 18.2 Pipeline despliegue

`GitHub` → SSH deploy → `pnpm install --frozen` → `prisma migrate deploy` → `pnpm build` → `pm2 reload mirana` ← Nginx (reverse proxy)

- **GitHub Actions:** lint → typecheck → build → SSH `deploy.sh`.
- **Zero-downtime**: `pm2 reload` (cluster).
- **Env**: `.env.production` en VPS (no en repo); validado con Zod en arranque.
- **Backups DB**: `pg_dump` diario a almacenamiento Hostinger + retención 14 días.
- **Monitoreo**: PM2 logs + `uptime-kuma` autohospedado (opcional).

### 18.3 Variables de entorno mínimas

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CULQI_PUBLIC_KEY=
CULQI_SECRET_KEY=
CULQI_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
WHATSAPP_NUMBER=
APP_URL=
```

---

## 19. Riesgos Técnicos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sobreventa por condición de carrera | Alto | Transacciones + guard `availableStock >= qty` + `version` (optimistic lock) + `reservedStock` |
| Webhook Culqi duplicado | Alto | `culqiEventId @unique` + `OutboxEvent.idempotencyKey` + verificación firma |
| Pérdida de side-effect post-pago (email, notif) | Alto | **Outbox Pattern** + retry exponencial |
| Pérdida de pago manual sin validar | Medio | Dashboard alertas + recordatorio admin |
| Hostinger VPS caído | Alto | Backups diarios + snapshots + plan B en otro VPS |
| Imágenes externas rotas | Bajo | Fallback placeholder + validación URL en import |
| Crecimiento de `InventoryMovement` y `OutboxEvent` | Medio | Partición por mes (futuro) + índices + purga de outbox procesado > 30 días |
| Bots scrapeando catálogo | Bajo | Rate limit + cache CDN |
| Fraude tarjetas | Alto | Confiar en antifraude Culqi + 3DS |
| Cron ejecutándose en múltiples instancias PM2 | Alto | Flag `JOBS_ENABLED` en una sola instancia |

---

## 20. Escalabilidad Futura

- **Caché Redis** (Upstash o instancia VPS) para sesiones y rate limit.
- **Cola externa** (BullMQ sobre Redis) cuando el volumen del Outbox supere la capacidad de `node-cron` (referencia: > 100k eventos/día).
- **CDN** (Cloudflare delante de Hostinger) para assets y HTML cacheado.
- **Multi-warehouse**: agregar `warehouseId` a `ProductInventory` (gracias a haberlo separado de `Product`, es trivial).
- **Multi-moneda** y **multi-idioma** (`next-intl`).
- **Programa de lealtad** (puntos, cupones).
- **Marketplace**: tabla `Seller` y `ProductSeller`.
- **App móvil**: reutilizar use cases de `modules/` vía tRPC o GraphQL en `/api`.
- **Search avanzado**: Meilisearch o Postgres FTS dedicado.
- **Feature flags**: tabla `FeatureFlag` o env vars tipadas para rollouts graduales (preventas, nuevos providers de pago).
- **Search avanzado**: Meilisearch o Postgres FTS dedicado.

---

## 21. Roadmap de Desarrollo

### Sprint 0 — Fundaciones (setup)
- [ ] Crear estructura base en la raíz: `app/`, `features/`, `modules/`, `events/`, `components/`, `stores/`, `providers/`, `lib/`, `config/`, `shared/`. Configurar `tsconfig.json`: `"paths": { "@/*": ["./*"] }`.
- [ ] Instalar Tailwind v4 tokens, Shadcn UI, Lucide, Framer Motion.
- [ ] Configurar Prisma, Postgres local (Docker), primera migración.
- [ ] Crear esqueleto de módulos: `modules/{auth,catalog,orders,payments,inventory,preorder,notifications}/`.
- [ ] Auth.js + Google + Credentials. `modules/auth/use-cases/require-role.ts`.
- [ ] `lib/proxy.ts` → `requireAuth` + `requireRole`. Usarlo en `app/(admin)/layout.tsx` y `app/(account)/layout.tsx`.
- [ ] Layouts (storefront, account, admin). Tema oscuro premium.
- [ ] `lib/prisma.ts`, `lib/auth.ts`, `lib/http.ts`, `lib/rate-limit.ts`, `lib/logger.ts`, `lib/utils.ts`.
- [ ] `config/env.ts` (Zod) + `config/constants.ts`.
- [ ] `shared/types/money.ts` + `shared/errors/`.
- [ ] **Outbox**: modelo `OutboxEvent` + `events/` (emit-event, dispatch-event, event.types) + `events/jobs/process-outbox.job.ts`.

### Sprint 1 — Catálogo público
- [ ] Modelos `Category`, `Brand`, `Product`, `ProductImage`, `ProductInventory`.
- [ ] `modules/catalog/repositories/product.repo.ts`, `category.repo.ts`, `brand.repo.ts`.
- [ ] Home (hero banners, destacados, nuevos, preventas).
- [ ] `/catalogo` con filtros, búsqueda, paginación.
- [ ] `/producto/[slug]` con galería, estados, CTA.
- [ ] SEO: metadata dinámica, sitemap, robots.

### Sprint 2 — Carrito + Checkout manual
- [ ] `stores/cart.store.ts` (Zustand + persist).
- [ ] `/carrito`, `/checkout` form.
- [ ] `modules/orders/use-cases/place-order.ts` + `modules/inventory/use-cases/reserve-stock.ts`.
- [ ] `modules/payments/providers/transfer.provider.ts` (WhatsApp + transferencia).
- [ ] Email confirmación vía evento `order.created` + handler.

### Sprint 3 — Checkout automático (Culqi)
- [ ] `modules/payments/providers/culqi.provider.ts` implementando `PaymentProvider`.
- [ ] Webhook firmado + idempotencia → `modules/payments/use-cases/handle-culqi-webhook.ts`.
- [ ] `modules/orders/use-cases/confirm-payment.ts` → `deduct-stock` + emit `order.paid`.
- [ ] `modules/orders/jobs/release-expired-reservations.job.ts`.
- [ ] `modules/payments/jobs/reconcile-culqi-payments.job.ts`.

### Sprint 4 — Panel administrativo base
- [ ] Dashboard KPIs (repos de lectura directa).
- [ ] CRUD productos, categorías, marcas, banners.
- [ ] Gestión pedidos (cambio estado, validar pago manual → reusa `confirm-payment`).
- [ ] Subida URLs imágenes (sin upload interno).

### Sprint 5 — Inventario avanzado
- [ ] `modules/inventory/use-cases/adjust-stock.ts` + `restock.ts`.
- [ ] Vista movimientos, ajustes manuales, restock.
- [ ] Alertas bajo stock vía `events/handlers/stock-updated.handler.ts`.
- [ ] Histórico completo + filtros.

### Sprint 6 — Preventas
- [ ] Modelo `Preorder`, UI countdown, badges.
- [ ] `modules/preorder/use-cases/reserve-preorder.ts` + `convert-to-stock.ts`.
- [ ] Flujo reserva + adelanto.
- [ ] Handler `preorder-arrived` → notifica reservantes.

### Sprint 7 — Carga masiva
- [ ] Endpoint `/admin/importar` (CSV/XLSX).
- [ ] Parser, validación Zod, preview, errores.
- [ ] Modo `create` vs `update`.

### Sprint 8 — Hardening + Deploy
- [ ] Rate limit en server actions y route handlers, headers seguridad, CSP.
- [ ] Tests (ver §27).
- [ ] Hostinger VPS + PM2 + Nginx + TLS.
- [ ] GitHub Actions CI/CD.
- [ ] Backups DB automatizados.
- [ ] Purga programada de `OutboxEvent` procesados > 30 días.

---

## 22. Convenciones de Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpetas | `kebab-case` | `bulk-import/` |
| Componentes React | `PascalCase.tsx` | `ProductCard.tsx` |
| Hooks | `useCamelCase.ts` | `useCart.ts` |
| Server Actions | `verb-noun.action.ts` | `start-checkout.action.ts` |
| Use case | `verb-noun.ts` | `place-order.ts`, `confirm-payment.ts` |
| Repository | `entity.repo.ts` | `order.repo.ts`, `product.repo.ts` |
| Payment provider | `name.provider.ts` | `culqi.provider.ts` |
| Event handler | `event-name.handler.ts` | `order-paid.handler.ts` |
| Job cron | `verb-noun.job.ts` | `process-outbox.job.ts` |
| Payment provider | `name.provider.ts` | `culqi.provider.ts` |
| Schemas Zod | `entity.schema.ts` | `checkout.schema.ts` |
| Tipos | `entity.types.ts` | `order.types.ts` |
| Enums Prisma | `SCREAMING_SNAKE_CASE` | `ORDER_STATUS` |
| Variables DB | `camelCase` | `paymentStatus` |
| Eventos de dominio | `entity.verb` (lowercase, punto) | `order.paid`, `stock.updated` |
| Rutas API | `kebab-case` | `/api/webhooks/culqi` |
| Branches Git | `feat/`, `fix/`, `chore/` | `feat/checkout-culqi` |
| Commits | Conventional Commits | `feat(cart): add quantity stepper` |

---

## 23. Estrategia de Estado Global

| Tipo de estado | Herramienta | Ubicación |
|---|---|---|
| Servidor (productos, órdenes) | RSC + repos de módulo + `unstable_cache` | `modules/<domain>/repositories/` |
| Servidor reactivo (admin tables, búsqueda) | TanStack Query | `features/<feature>/hooks/` |
| UI efímero global (modales, drawers) | Zustand `ui.store` | `stores/ui.store.ts` |
| Carrito | Zustand + `persist` localStorage | `stores/cart.store.ts` |
| Formularios | React Hook Form | local al componente |
| Sesión usuario | Auth.js `auth()` server / `useSession()` client | — |

**Reglas:**
- **No** duplicar server state en stores cliente. El carrito es la única excepción (estado puro cliente hasta el checkout).
- Los stores Zustand globales viven en `stores/` (no en slices). UI efímero local a un slice puede usar `useState` o un store local del slice si fuera necesario.

---

## 24. Estrategia de Caching

### 24.1 Server (Next.js)

- **Static + ISR** para home y páginas de producto: `export const revalidate = 60`.
- **`fetch` con tags**: `next: { tags: ['product:'+id, 'catalog'] }`.
- **`revalidateTag('catalog')`** desde server actions al crear/editar producto.
- **`revalidatePath('/producto/[slug]')`** específico.
- **`unstable_cache`** para queries Prisma de catálogo público.

### 24.2 Browser

- TanStack Query: `staleTime: 60s` en listados admin.
- Imágenes: `next/image` con cache headers largos.

### 24.3 HTTP

- Nginx: `Cache-Control: public, max-age=31536000, immutable` para `/_next/static`.
- Catálogo público: `s-maxage=60, stale-while-revalidate=300`.

### 24.4 Datos sensibles

- **Nunca cachear**: `/checkout`, `/admin/**`, `/pedido/[id]`, `/perfil`.

---

## 25. Estrategia de Error Handling

### 25.1 Jerarquía de errores

```ts
// shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public details?: unknown,
  ) { super(message); }
}
export class ValidationError extends AppError { /* 400 */ }
export class UnauthorizedError extends AppError { /* 401 */ }
export class ForbiddenError extends AppError { /* 403 */ }
export class NotFoundError extends AppError { /* 404 */ }
export class OutOfStockError extends AppError { /* 409 */ }
export class PaymentError extends AppError { /* 402 */ }
```

### 25.2 Capas

- **Use cases (`modules/<domain>/use-cases/`)**: lanzan `AppError` tipados.
- **Server Actions**: capturan, devuelven `{ ok: false, error: { code, message } }`.
- **Route Handlers**: helper `withErrorHandler` mapea a HTTP.
- **Event handlers**: errores hacen retry vía Outbox (backoff exponencial).
- **UI**: `error.tsx` por segmento; toast (`sonner`) para errores recoverable.
- **Logging**: errores `5xx` y `PaymentError` se loguean con contexto (sin datos sensibles).
- **Boundary cliente**: `<ErrorBoundary>` solo para componentes interactivos críticos (checkout).

### 25.3 Reglas

- Nunca exponer stack traces al cliente.
- Mensajes para usuario final son en español, claros, accionables.
- Códigos de error estables (`PAYMENT_DECLINED`, `STOCK_INSUFFICIENT`) para soporte.

---

## 26. Seguridad

- **CSP** estricta vía `next.config.ts` headers.
- **CSRF**: Server Actions de Next ya incluyen protección; webhooks usan firma HMAC.
- **Rate limit** (`/api/checkout/*`, `/api/auth/*`, server actions de login/registro/checkout): in-memory LRU para MVP, Redis a futuro.
- **Validación webhooks Culqi**: verificar header firma con `CULQI_WEBHOOK_SECRET`.
- **Sanitización**: descripciones de producto se renderizan como texto plano o Markdown sanitizado (`rehype-sanitize`).
- **Secrets**: nunca en repo, solo `.env.production` en VPS, permisos `600`.
- **Headers**: `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **Dependabot** + `pnpm audit` en CI.
- **RBAC** verificado en cada use case admin de `modules/<domain>/use-cases/` (no solo en el proxy de layout).
- **Logging** sin PII sensible (no logs de tarjetas, no passwords, no payloads completos de Culqi).
- **`OutboxEvent.payload`**: nunca persistir datos sensibles (tarjetas, tokens completos). Solo IDs.

---

## 27. Testing

### 27.1 Estrategia por capa

| Capa | Herramienta | Qué se testea |
|---|---|---|
| Utils puros (`Money`, formatters) | Vitest | Cálculo, serialización |
| Use cases (`modules/<domain>/use-cases/`) | Vitest + DB test (Postgres en Docker) | Reglas de negocio, transacciones, eventos emitidos |
| Repositories (`modules/<domain>/repositories/`) | Vitest + DB test | Forma de queries, edge cases |
| Event handlers | Vitest | Idempotencia, side-effects mockeados |
| Webhooks (route handlers) | Vitest + supertest | Firma, idempotencia, status codes |
| Flujos críticos UI | Playwright | Checkout completo, login, reserva preventa |

### 27.2 Cobertura objetivo

- **Use cases de checkout, inventory, payment**: 100%.
- **Event handlers**: 100% en idempotencia.
- **Resto**: cobertura orgánica, sin obsesión por %.

### 27.3 Reglas

- **Tests de use cases usan DB real de test** (no mocks de Prisma). Mockear Prisma es frágil y oculta bugs.
- **Tests de handlers sí mockean** infraestructura externa (SMTP, Culqi).
- **No tests de componentes React** salvo lógica compleja (form steppers, calculadoras). El render se prueba en Playwright.
- **CI** corre tests en cada PR; bloquea merge si fallan.

---

## 28. Carga Masiva (CSV / XLSX)

### 28.1 Endpoint

`POST /api/admin/import` (multipart) — solo `ADMIN`.

### 28.2 Pipeline

Upload → Parse (papaparse/xlsx) → Zod validation por fila → Resolver categoría/marca por slug → Diff vs DB → Preview UI (OK/Errores/Conteo) → Confirmar → Batch upsert en transacciones de 100 → Movimientos inventario si stock cambia

### 28.3 Schema fila

```ts
const RowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  description: z.string().default(''),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  preorder_stock: z.coerce.number().int().nonnegative().default(0),
  category: z.string(),       // slug
  brand: z.string(),          // slug
  image_urls: z.string()       // separadas por |
    .transform(s => s.split('|').map(u => u.trim()).filter(Boolean))
    .pipe(z.array(z.string().url())),
  status: z.enum(['AVAILABLE','PREORDER','SOLD_OUT','COMING_SOON']),
  featured: z.coerce.boolean().default(false),
});
```

### 28.4 Validaciones específicas

- **Duplicados** dentro del archivo (por `sku`).
- **Categorías/marcas inexistentes**: opción "crear si no existe" o rechazar.
- **URLs inválidas** o no `https`: rechazar.
- **Stock negativo**: rechazar.
- **Preview** muestra: filas válidas, filas con error (con motivo), resumen (`X creadas, Y actualizadas`).

---

## 29. Diseño UI/UX

### 29.1 Lenguaje visual

- **Paleta:** definida centralizadamente en `globals.css` vía Tailwind v4 `@theme` (ver [sección 30](#30-sistema-de-theming-y-paleta-de-colores-tailwind-v4)). Los colores definitivos los entregará el cliente; el sistema permite cambiar toda la marca editando una sola variable por escala.
- **Tono base:** oscuro premium (near-black) + un color de marca (escala 50→950) + neutros cálidos.
- **Tipografía:** display para títulos, sans para texto — cargadas vía `@import` en `globals.css` y registradas como `--font-*` en `@theme`.
- **Espaciado:** escala 4px, generoso (sensación premium).
- **Bordes:** sutiles (`border-white/5`), radios `xl` y `2xl`.
- **Sombras:** profundas y suaves (`shadow-2xl shadow-black/40`).
- **Glassmorphism** controlado en navbar y modales.

### 29.2 Componentes signature

- **Hero cinemático**: video/imagen full-bleed + degradado, badges "PREVENTA", countdown.
- **ProductCard**: imagen 1:1, hover con segunda imagen, badge estado, precio con `compareAtPrice` tachado.
- **PreorderBadge** con icono y fecha llegada.
- **Empty states** con ilustración minimal.

### 29.3 Microinteracciones

- Hover en card: leve `scale-[1.02]` + glow.
- Transiciones de página suaves.
- Skeletons coherentes durante streaming.

### 29.4 Accesibilidad

- Contraste AA mínimo (AAA en texto principal).
- Focus visible coherente.
- ARIA en componentes interactivos (Shadcn lo cubre).
- Soporte teclado completo en navegación y carrito.

---

## 30. Sistema de Theming y Paleta de Colores (Tailwind v4)

### 30.1 Cómo funciona

`app/globals.css` es la única fuente de verdad. Tailwind v4 **no usa** `tailwind.config.ts` — la configuración es CSS-first con tres directivas:

| Directiva | Para qué sirve |
|---|---|
| `@theme` | Define tokens → genera utility classes (`bg-gold-500`, `font-display`, `animate-fade-in`) |
| `@theme inline` | Para tokens que referencian otras CSS vars (ej. fuentes de `next/font`) |
| `:root` | Variables CSS que NO generan utility classes (legado, o tokens no-Tailwind) |

### 30.2 Estructura de `globals.css`

```
1. @import "tailwindcss"           ← Tailwind v4 (sin tailwind.config.ts)
2. @custom-variant dark ...        ← modo oscuro con clase .dark
3. @theme inline { fuentes }       ← fonts referenciando next/font vars
4. @theme { colores, radios, sombras, @keyframes + --animate-* }
5. :root { vars legacy que apuntan a @theme }
6. @layer base { body, h1..h4, scrollbar }
7. @layer components { .btn-gold, .pcard, etc. con @apply }
```

### 30.3 Utility classes disponibles

Desde `@theme` el build genera automáticamente:

```tsx
/* Colores */
<div className="bg-gold-500 text-gold-500 border-gold-500" />
<div className="bg-bg bg-card bg-surf" />
<div className="text-muted text-text border-border" />
<div className="bg-success text-danger" />

/* Tipografía */
<h1 className="font-display" />
<p className="font-sans" />

/* Radios */
<div className="rounded-xl rounded-2xl" />

/* Sombras */
<div className="shadow-premium shadow-card shadow-gold" />

/* Animaciones */
<div className="animate-fade-in animate-slide-up animate-fade-up" />
<div className="animate-marquee animate-pulse-dot" />
```

### 30.4 Reglas

- **Nunca** usar `style={{ color: "var(--gold)" }}` en código nuevo. Usar `className="text-gold-500"`.
- **Nunca** hex hardcodeados en componentes (`#c9a840`, `bg-[#07090f]`). Todo pasa por `@theme`.
- **`@apply`** en `@layer components` para los pocos componentes CSS que no son puramente Tailwind.
- Las variables `:root` (`--gold`, `--card`, etc.) existen solo para retrocompatibilidad con el código existente.
- Para cambiar el color de marca: editar solo `--color-gold-*` en `@theme` → rebuild → toda la app actualizada.

### 30.5 Naming

| Namespace | Utility | Ejemplo |
|---|---|---|
| `--color-gold-*` | `bg-gold-500`, `text-gold-500` | CTAs, precios, acentos |
| `--color-surface-*` | `bg-surface-950`, `text-surface-50` | Fondos y texto neutro |
| `--color-bg/card/surf` | `bg-bg`, `bg-card` | Tokens de diseño exactos |
| `--color-muted/border` | `text-muted`, `border-border` | Texto secundario y bordes |
| `--color-success/danger` | `bg-success`, `text-danger` | Estados semánticos |
| `--font-display/sans` | `font-display`, `font-sans` | Tipografía |
| `--animate-*` | `animate-fade-in`, `animate-slide-up` | Animaciones |

---

## Próximo paso sugerido

Iniciar **Sprint 0**:

1. Crear estructura base en la raíz: `app/`, `features/`, `modules/`, `events/`, `components/`, `stores/`, `providers/`, `lib/`, `config/`, `shared/`. Configurar `tsconfig.json`: `"paths": { "@/*": ["./*"] }`.
2. Instalar dependencias base: `pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter zod react-hook-form @hookform/resolvers zustand @tanstack/react-query @tanstack/react-query-devtools lucide-react sonner framer-motion class-variance-authority clsx tailwind-merge node-cron pino`.
3. Inicializar Shadcn UI: `pnpm dlx shadcn@latest init`.
4. Crear `prisma/schema.prisma` con el diseño de la sección 9 (incluye `ProductInventory` y `OutboxEvent`).
5. Crear esqueleto `server/{auth,db,events,jobs}/` y `stores/`.
6. Configurar Auth.js con Google + Credentials.
7. Implementar `lib/proxy.ts` con `requireAuth` y `requireRole`. Usarlo en `app/(admin)/layout.tsx` y `app/(account)/layout.tsx`.
8. Implementar bus de eventos + Outbox worker desde el inicio (`events/` + `events/jobs/process-outbox.job.ts`).
9. Definir `globals.css` con el sistema de theming de la sección 30 (placeholder hasta recibir paleta definitiva).
10. Definir layouts y tema premium oscuro consumiendo los tokens.

> Este plan es el **contrato técnico** del proyecto. Cambios estructurales (stack, modelo de datos, flujos de pago, dominio compartido) deben actualizar este documento primero.
