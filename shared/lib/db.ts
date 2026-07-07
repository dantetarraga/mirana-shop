import { PrismaClient } from "../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// ---------------------------------------------------------------------------
// Singleton de PrismaClient para Next.js.
// En dev, hot-reload recrea módulos — el globalThis evita múltiples instancias.
// En producción el módulo se evalúa una sola vez, el global no importa.
// Patrón oficial: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
// ---------------------------------------------------------------------------

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no definida");

  const url = new URL(connectionString);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    decimalAsNumber: true,
    bigIntAsNumber: true,
    connectionLimit: 10,
    acquireTimeout: 15000,
  });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
