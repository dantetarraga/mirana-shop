import { AdminSidebar } from "@/features/admin/_shared/components/AdminSidebar";
import { AdminTopbar } from "@/features/admin/_shared/components/AdminTopbar";
import React from "react";

/**
 * Layout del panel de administración.
 * Es un Server Component: no tiene "use client".
 * La interactividad (pathname, useState) vive en AdminSidebar y AdminTopbar.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      <AdminSidebar />

      <main className="flex-1 min-w-0 ml-[248px]">
        <AdminTopbar />
        {children}
      </main>
    </div>
  );
}
