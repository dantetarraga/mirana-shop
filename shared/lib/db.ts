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
  const adapter = new PrismaMariaDb(
    {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      decimalAsNumber: true,
      bigIntAsNumber: true,
      // Pool chico a propósito: el hosting (Hostinger) limita a 500 conexiones
      // NUEVAS por hora y por usuario de BD, y al agotarlas tumba el sitio.
      // - connectionLimit 5: tope de conexiones simultáneas por proceso.
      // - minimumIdle 1: se conserva una conexión abierta para no reconectar
      //   en cada request tras un rato sin tráfico.
      // - idleTimeout 120 s: las conexiones extra se liberan antes de que el
      //   servidor las corte por wait_timeout (que en hosting compartido suele
      //   ser bajo); una conexión cortada por el servidor cuesta igual una
      //   reconexión y además un error en la query que la encuentra muerta.
      connectionLimit: 5,
      minimumIdle: 1,
      idleTimeout: 120,
      acquireTimeout: 15000,
    },
    // El protocolo binario (execute) hace que el query compiler de Prisma
    // fuerce collation utf8mb4_bin en filtros LIKE (contains/startsWith/endsWith),
    // lo cual choca con las columnas utf8mb4_unicode_ci del schema y tira
    // "Illegal mix of collations" (500 en cualquier buscador). El protocolo de
    // texto evita el choque.
    { useTextProtocol: true },
  );
  return new PrismaClient({ adapter });
}

declare global {
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
