---
name: project-prisma-setup
description: Configuración de Prisma + PostgreSQL en Docker establecida en Fase 1 — archivos creados, modelos incluidos/excluidos, rutas clave
metadata:
  type: project
---

Prisma con PostgreSQL 16 configurado para Mirana Shop (Fase 1 del stack de datos).

**Archivos creados:**
- `docker-compose.yml` — PostgreSQL 16 Alpine, credenciales `mirana/mirana_dev`, DB `mirana_shop`, puerto 5432
- `.env` — DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET (ignorado por git)
- `.env.example` — plantilla commitable (el .gitignore tiene `!.env.example`)
- `prisma/schema.prisma` — schema completo Fase 1
- `shared/lib/prisma.ts` — singleton PrismaClient con guard HMR de Next.js
- `prisma/seed.ts` — seed compatible con ts-node (CommonJS)

**Modelos incluidos en Fase 1:**
User, Profile, Account, Session, VerificationToken (Auth.js), Category, Brand, Product, ProductImage, ProductInventory, Order, OrderItem, Payment, ShippingAddress, InventoryMovement, Banner

**Excluidos para Fase 2:**
Preorder, OutboxEvent

**Enums definidos:**
Role, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, InventoryMovementType, InventoryStockType

**Scripts añadidos a package.json:**
db:generate, db:migrate, db:studio, db:seed, db:reset
También configurado `prisma.seed` en package.json para `prisma db seed`.

**Seed incluye:**
- Admin: admin@mirana.com (sin password, role ADMIN)
- 2 categorías: "Figuras de Acción" (figuras-de-accion), "Sets LEGO" (sets-lego)
- 2 marcas: Bandai (bandai), LEGO Group (lego-group)
- 4 productos: Goku SS, Evangelion Unit-01, Millennium Falcon, Bugatti Bolide (COMING_SOON)
- 1 banner activo con id fijo `seed-banner-hero-01`

**Why:** Fase 1 del proyecto; Preorder y OutboxEvent se posponen para reducir complejidad inicial.

**How to apply:** Al sugerir nuevos modelos o relaciones, verificar primero si extienden modelos existentes o si corresponden a Fase 2. El prisma.ts vive en `shared/lib/` no en `lib/`.
