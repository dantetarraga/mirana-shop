'use client'

import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import { LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PerfilPage() {
  const { user, logout, openAuth } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      // pequeño delay para evitar flash antes de hidratación
      const t = setTimeout(() => openAuth('login'), 300)
      return () => clearTimeout(t)
    }
  }, [user, openAuth])

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted text-[14px]">Cargando…</p>
      </div>
    )
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="max-w-160 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Cuenta</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
          Mi Perfil
        </h1>
      </div>

      <div className="flex flex-col gap-5">
        {/* Avatar + nombre */}
        <div className="bg-card border border-(--bd) p-6 flex items-center gap-5">
          <div className="w-16 h-16 shrink-0 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center font-display font-black text-[22px] text-(--gold)">
            {initials}
          </div>
          <div>
            <p className="font-display font-black uppercase text-[18px] tracking-tight leading-tight">
              {user.name}
            </p>
            <p className="text-[12px] text-muted mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Datos */}
        <div className="bg-card border border-(--bd) p-6 flex flex-col gap-4">
          <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Información</p>

          <div className="flex items-center gap-3">
            <User size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Nombre</p>
              <p className="text-[14px] font-semibold">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Correo</p>
              <p className="text-[14px] font-semibold">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Rol</p>
              <p className="text-[14px] font-semibold capitalize">
                {user.role === 'admin' ? 'Administrador' : 'Cliente'}
              </p>
            </div>
          </div>
        </div>

        {/* Cerrar sesión */}
        <Button variant="outline" size="md" onClick={handleLogout} className="self-start">
          <LogOut size={14} className="mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
