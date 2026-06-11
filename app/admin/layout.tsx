import { AdminSidebar } from '@/shared/components/admin/AdminSidebar'
import { AdminTopbar } from '@/shared/components/admin/AdminTopbar'
import React from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      <AdminSidebar />

      <main className="flex-1 min-w-0 ml-62">
        <AdminTopbar />

        {children}
      </main>
    </div>
  )
}
