# Mirana Shop — Memory Index

- [Auditoría Admin Dashboard](audit_admin_dashboard.md) — 10 problemas concretos identificados: doble layout, features mal estructuradas, ProductCard duplicado 3x, tipos duplicados, store inconsistente
- [Refactor Admin Completado](refactor_admin_completed.md) — 10 fases implementadas: shared components, rutas reales, store con banners, tipos explícitos, layout Server Component
- [Prisma + Docker Setup](project_prisma_setup.md) — Fase 1: schema completo, 16 modelos, docker-compose PG16, seed con 4 productos, prisma.ts en shared/lib/
- [Migración Mock → BD Real](project_db_migration.md) — Repos, Server Actions, páginas admin como Server+Client, storefront real, seed con 12 productos y 7 marcas
- [Schema v2: Collections + campos enriquecidos](project_schema_v2.md) — Collection, ProductCollection, salePrice, description/imageUrl en Brand y Category; 3 colecciones en seed
- [Zod v4 + react-hook-form: usar z.input<>](feedback_zod_v4_rhf.md) — useForm<z.input<typeof schema>> para evitar error de tipos con .default()
- [Next.js 16 APIs: revalidateTag(tag, profile) y searchParams await](feedback_nextjs16_apis.md) — Cambios de firma que rompen build en Next.js 16
- [EntityProductsDrawer + Colecciones en productos](project_entity_products_drawer.md) — Drawer compartido collections/brands/categories, tipo DrawerProduct, columna colecciones, toast colors
- [Separación Server/Client Components Validada](feedback_server_client_separation.md) — Estrategia para dividir monolitos Client en componentes granulares: coordinador + Card + FormDrawer; reduce bundle ~60-70%
- [Refactor BannersClient Granular](refactor_banners_granular.md) — BannersClient.tsx: 312 líneas monolito → 160 líneas coordinador + BannerCard + BannerFormDrawer; 0 errores TypeScript, mejora performance
