'use client'

import { OrdersCarousel } from '@/features/orders/components/OrdersCarousel'
import type { ProfileData } from '@/features/profile/actions/account-profile.actions'
import { ProfileCard } from '@/features/profile/components/ProfileCard'
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm'
import type { OrderListItem } from '@/features/orders/services/order.service'
import type { SessionUser } from '@/shared/hooks/useUser'
import { Button } from '@/shared/components/ui/Button'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { use, useState } from 'react'

export function PerfilContent({
  user,
  profilePromise,
  ordersPromise,
}: {
  user: SessionUser
  profilePromise: Promise<ProfileData | null>
  ordersPromise: Promise<OrderListItem[]>
}) {
  const profileData = use(profilePromise)
  const orders = use(ordersPromise).slice(0, 6)

  const [profile, setProfile] = useState<ProfileData>(
    profileData ?? {
      name: user.name,
      email: user.email,
      phone: null,
      dni: null,
      hasKids: false,
      kidsCount: null,
    },
  )

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Cuenta</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
          Mi Perfil
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">
          <ProfileCard
            user={user}
            profile={{
              phone: profile.phone,
              dni: profile.dni,
              hasKids: profile.hasKids,
              kidsCount: profile.kidsCount,
            }}
          />

          {/* Editar */}
          <div className="bg-card border border-(--bd) p-6">
            <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-4">
              Editar informacion
            </p>
            <ProfileEditForm
              profile={profile}
              email={user.email}
              onSaved={(updated) => setProfile((p) => ({ ...p, ...updated }))}
            />
          </div>

          {/* Links */}
          <div className="bg-card border border-(--bd) p-5 flex flex-col gap-2">
            <Link
              href="/cuenta/direcciones"
              className="text-[13px] font-semibold text-text no-underline hover:text-(--gold) transition-colors duration-150 py-1"
            >
              Mis direcciones
            </Link>
            <Link
              href="/cuenta/pedidos"
              className="text-[13px] font-semibold text-text no-underline hover:text-(--gold) transition-colors duration-150 py-1"
            >
              Ver todos mis pedidos
            </Link>
          </div>

          <Button variant="outline" size="md" onClick={handleLogout} className="self-start">
            <LogOut size={14} className="mr-2" />
            Cerrar sesion
          </Button>
        </div>

        {/* Columna derecha: ultimas ordenes */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Ultimos pedidos</p>
            <Link
              href="/cuenta/pedidos"
              className="text-[12px] text-muted hover:text-(--gold) transition-colors no-underline"
            >
              Ver todos
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card border border-(--bd) p-8 text-center flex flex-col items-center gap-3">
              <p className="text-[13px] text-muted">Aun no tienes pedidos.</p>
              <Link href="/catalogo">
                <Button variant="accent" size="sm">
                  Ver catalogo
                </Button>
              </Link>
            </div>
          ) : (
            <OrdersCarousel orders={orders} />
          )}
        </div>
      </div>
    </div>
  )
}
