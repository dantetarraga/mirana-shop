import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma migrate dev` necesita una base espejo (shadow database) que crea
    // y destruye para validar el diff. En hosting compartido el usuario no
    // suele tener permiso para crear bases, así que se apunta a una segunda
    // base vacía creada a mano. Sin SHADOW_DATABASE_URL, usar `db:migrate`
    // contra un MySQL local o en Docker.
    //
    // Se inyecta condicionalmente y NO con el helper `env()`: ese helper lanza
    // si la variable falta, y eso rompería todos los comandos de Prisma
    // (incluido el `postinstall`) para quien no la tenga configurada.
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
