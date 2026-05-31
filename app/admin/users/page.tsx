import { db } from "@/shared/lib/db";
import { UsersClient } from "@/features/users/components/UsersClient";

async function getUsers() {
  return db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      deletedAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export type AdminUserRow = Awaited<ReturnType<typeof getUsers>>[number];

export default async function UsersPage() {
  const users = await getUsers();
  return <UsersClient initialUsers={users} />;
}
