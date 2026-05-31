import { userRepo, type UserSegment, type UserRow } from "@/modules/users/repositories/user.repo";
import { UsersClient } from "@/features/users/components/UsersClient";

export type { UserRow };

const VALID_SEGMENTS = new Set<UserSegment>(["todos", "vip", "activo", "nuevo"]);

function toSegment(v: string | undefined): UserSegment {
  return v && VALID_SEGMENTS.has(v as UserSegment) ? (v as UserSegment) : "todos";
}

interface PageProps {
  searchParams: Promise<{ q?: string; segment?: string; page?: string }>;
}

const PER_PAGE = 50;

export default async function UsersPage({ searchParams }: PageProps) {
  const { q, segment: rawSegment, page: rawPage } = await searchParams;
  const segment = toSegment(rawSegment);
  const page = Math.max(1, Number(rawPage ?? 1));
  const skip = (page - 1) * PER_PAGE;

  const [users, total] = await Promise.all([
    userRepo.findMany({ search: q, segment, take: PER_PAGE, skip }),
    userRepo.count({ search: q, segment }),
  ]);

  return (
    <UsersClient
      users={users}
      total={total}
      currentPage={page}
      perPage={PER_PAGE}
      currentQ={q ?? ""}
      currentSegment={rawSegment ?? "todos"}
    />
  );
}
