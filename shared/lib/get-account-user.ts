import { auth } from '@/auth'
import type { SessionUser } from '@/shared/hooks/useUser'
import { redirect } from 'next/navigation'

export async function getAccountUser(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  return {
    name: session.user.name ?? session.user.email.split('@')[0],
    email: session.user.email,
    role: session.user.role,
  }
}
