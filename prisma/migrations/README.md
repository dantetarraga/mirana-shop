# Migraciones

Historial versionado del esquema. Cada cambio queda como un `.sql` revisable en
git, en vez de aplicarse directo contra la base sin dejar rastro.

## Estado

`0_init` es el **baseline**: representa el esquema tal como existía el
2026-07-25, cuando se adoptaron las migraciones. No se ejecutó nunca — se marcó
como aplicada con `prisma migrate resolve --applied 0_init`, porque la base ya
tenía esas tablas. Antes de marcarla se verificó con `prisma migrate diff
--from-config-datasource --to-schema` que no hubiera desviaciones.

A partir de aquí, todo cambio de esquema debería pasar por una migración.

## Flujo

**Desarrollo** — crea el `.sql`, lo aplica y regenera el cliente:

```bash
pnpm db:migrate --name descripcion_del_cambio
```

**Producción** — aplica las migraciones pendientes, sin generar ninguna nueva:

```bash
pnpm db:migrate:deploy
```

**Ver qué falta por aplicar:**

```bash
pnpm db:migrate:status
```

## Shadow database

`prisma migrate dev` necesita una base espejo que crea y destruye para validar
el diff. En hosting compartido el usuario de MySQL no suele poder crear bases,
así que hay que crear a mano una segunda base **vacía** y declararla en
`SHADOW_DATABASE_URL` (ver `.env.example`). Alternativa: correr `db:migrate`
contra un MySQL local o en Docker.

`db:migrate:deploy` **no** usa shadow database — en producción no hace falta.

## Sobre `db:push`

`pnpm db:push` sigue existiendo, pero ahora **compite** con las migraciones:
aplica cambios sin registrarlos, así que la base y el historial se desincronizan
y el siguiente `migrate dev` detecta una desviación. Usar `db:migrate` para
cualquier cambio de esquema.

> `DATABASE_URL` apunta a la base de **producción**. Verificar el host que
> imprime Prisma antes de ejecutar cualquier comando que escriba.
