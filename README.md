# Mirana Shop

Ecommerce de figuras coleccionables construido con Next.js 16, React 19,
TypeScript, Prisma 7 y MySQL. Incluye catálogo, carrito, checkout manual,
preventas, cuenta de cliente y panel administrativo.

## Requisitos

- Node.js 20.19 o superior
- pnpm 11.19
- MySQL/MariaDB para desarrollo
- Cuenta de Cloudinary si se usarán cargas de imágenes

## Desarrollo local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Edita `.env` antes de migrar. Los scripts que escriben en la base bloquean por
defecto hosts remotos para reducir el riesgo de modificar producción desde una
máquina de desarrollo.

## Variables importantes

- `DATABASE_URL`: base de desarrollo o producción del entorno actual.
- `SHADOW_DATABASE_URL`: base vacía usada solo por `prisma migrate dev`.
- `NEXT_PUBLIC_SITE_URL`: origen público; en producción debe ser HTTPS.
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Auth.js.
- `CRON_SECRET`: protege todos los endpoints `/api/cron/*`.
- `RATE_LIMIT_SECRET`: anonimiza las claves persistentes de rate limiting.
- `ORDER_RESERVATION_TTL_MINUTES`: vigencia del stock reservado por pedidos sin pago.
- `CLOUDINARY_URL`: almacenamiento de imágenes.

Consulta `.env.example` para el listado completo. No subas `.env` al repositorio.

## Verificación

```bash
pnpm check
pnpm test:coverage
```

`pnpm check` ejecuta TypeScript, ESLint y las pruebas unitarias. El mismo comando
se ejecuta en GitHub Actions para pushes a `main` y pull requests.

## Base de datos

```bash
pnpm db:generate          # genera el cliente, no escribe datos
pnpm db:migrate           # crea una migración en desarrollo
pnpm db:migrate:deploy    # aplica migraciones existentes en el despliegue
pnpm db:migrate:status
pnpm db:studio
pnpm db:seed
```

Los comandos de escritura solo permiten `localhost`, `127.0.0.1` y `::1`. Para
una ejecución remota deliberada hay que definir temporalmente
`ALLOW_REMOTE_DB_WRITE=I_UNDERSTAND`. No dejes esa variable configurada.

## Tareas programadas

Configura peticiones `POST` con el header `Authorization: Bearer <CRON_SECRET>`:

- `/api/cron/orders`: vence reservas impagas y devuelve stock.
- `/api/cron/carts`: elimina carritos caducados.
- `/api/cron/preorders`: libera preventas cuya fecha llegó.
- `/api/cron/alerts`: genera alertas administrativas.

Una frecuencia sugerida es cada 10–15 minutos para pedidos, cada 6 horas para
carritos, diaria para preventas y dos veces al día para alertas.

## Despliegue

1. Crea una base de producción separada y configura secretos propios del entorno.
2. Ejecuta `pnpm install --frozen-lockfile` y `pnpm db:migrate:deploy`.
3. Ejecuta `pnpm build` y arranca con `pnpm start`.
4. Programa los cron jobs anteriores usando headers, nunca secretos en la URL.
5. Verifica OAuth, Cloudinary, checkout y expiración de reservas en staging.

El plan original de producto se conserva en `docs/PLAN-IMPLEMENTATION.md` como
referencia histórica; el esquema Prisma y este documento describen la operación vigente.
