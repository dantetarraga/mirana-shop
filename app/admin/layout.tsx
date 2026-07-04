import { auth } from '@/auth'
import { getAdminAlerts } from '@/features/alerts/queries/alert.queries'
import { AdminSidebar } from '@/shared/components/admin/AdminSidebar'
import { AdminTopbar } from '@/shared/components/admin/AdminTopbar'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const { alerts, unreadCount } = await getAdminAlerts()

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      <AdminSidebar />

      <main className="flex-1 min-w-0 ml-62">
        <AdminTopbar alerts={alerts} unreadCount={unreadCount} />

        {children}
      </main>
    </div>
  )
}
