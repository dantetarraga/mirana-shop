'use client'

import type { SessionUser } from '@/shared/hooks/useUser'
import { Baby, CreditCard, Mail, Phone, User as UserIcon } from 'lucide-react'

export interface ProfileDisplayData {
  phone?: string | null
  dni?: string | null
  hasKids?: boolean
  kidsCount?: number | null
}

export function ProfileCard({
  user,
  profile,
}: {
  user: SessionUser
  profile: ProfileDisplayData | null
}) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
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

      {/* Datos fijos */}
      <div className="bg-card border border-(--bd) p-6 flex flex-col gap-4">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Datos personales</p>

        <div className="flex items-center gap-3">
          <UserIcon size={15} className="text-muted shrink-0" />
          <div>
            <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Nombre completo</p>
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

        {profile?.dni && (
          <div className="flex items-center gap-3">
            <CreditCard size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">DNI</p>
              <p className="text-[14px] font-semibold">{profile.dni}</p>
            </div>
          </div>
        )}

        {profile?.phone && (
          <div className="flex items-center gap-3">
            <Phone size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Teléfono</p>
              <p className="text-[14px] font-semibold">{profile.phone}</p>
            </div>
          </div>
        )}

        {profile?.hasKids && (
          <div className="flex items-center gap-3">
            <Baby size={15} className="text-muted shrink-0" />
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[1.5px]">Hijos</p>
              <p className="text-[14px] font-semibold">
                {profile.kidsCount ?? 1} hijo{(profile.kidsCount ?? 1) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
