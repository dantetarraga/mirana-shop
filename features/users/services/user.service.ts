import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type UserSegment = "todos" | "vip" | "activo" | "nuevo";

export type UserRow = {
  id:        string;
  name:      string | null;
  email:     string;
  role:      "ADMIN" | "CUSTOMER";
  createdAt: Date;
  deletedAt: Date | null;
  _count:    { orders: number };
};

export type UserFilters = {
  search?:  string;
  segment?: UserSegment;
  take?:    number;
  skip?:    number;
};

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

// Prisma no soporta filtrar por COUNT de relaciones en where.
// Usamos $queryRaw para obtener los IDs que cumplen la condición
// y luego los pasamos al findMany normal.
async function getUserIdsBySegment(segment: UserSegment): Promise<string[] | null> {
  if (segment === "todos") return null;

  if (segment === "nuevo") return null; // Se maneja con orders: { none: {} } en Prisma

  if (segment === "vip") {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User"
      WHERE "deletedAt" IS NULL
        AND (SELECT COUNT(*) FROM "Order" WHERE "userId" = "User".id) >= 10
    `;
    return rows.map((r) => r.id);
  }

  if (segment === "activo") {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User"
      WHERE "deletedAt" IS NULL
        AND (SELECT COUNT(*) FROM "Order" WHERE "userId" = "User".id) BETWEEN 1 AND 9
    `;
    return rows.map((r) => r.id);
  }

  return null;
}

const SELECT = {
  id: true, name: true, email: true, role: true,
  createdAt: true, deletedAt: true,
  _count: { select: { orders: true } },
} as const;

// ---------------------------------------------------------------------------
// UserRepo
// ---------------------------------------------------------------------------

export const userRepo = {
  async findMany(filters: UserFilters = {}): Promise<UserRow[]> {
    const { search, segment = "todos", take = 100, skip = 0 } = filters;

    const segmentIds = await getUserIdsBySegment(segment);

    return db.user.findMany({
      where: {
        deletedAt: null,
        ...(segment === "nuevo" ? { orders: { none: {} } } : {}),
        ...(segmentIds !== null ? { id: { in: segmentIds } } : {}),
        ...(search ? {
          OR: [
            { name:  { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: SELECT,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }) as Promise<UserRow[]>;
  },

  async count(filters: Omit<UserFilters, "take" | "skip"> = {}): Promise<number> {
    const { search, segment = "todos" } = filters;

    const segmentIds = await getUserIdsBySegment(segment);

    return db.user.count({
      where: {
        deletedAt: null,
        ...(segment === "nuevo" ? { orders: { none: {} } } : {}),
        ...(segmentIds !== null ? { id: { in: segmentIds } } : {}),
        ...(search ? {
          OR: [
            { name:  { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
    });
  },

  async findById(id: string): Promise<UserRow | null> {
    return db.user.findUnique({
      where: { id },
      select: SELECT,
    }) as Promise<UserRow | null>;
  },
};
