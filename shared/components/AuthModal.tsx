'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { LayoutGrid, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import {
  loginSchema, registerSchema,
  type LoginInput, type RegisterInput,
} from '@/shared/lib/schemas'

type FormValues = LoginInput & Partial<Pick<RegisterInput, 'name' | 'confirm'>>

const inputCls = 'adm-input'
const labelCls = 'text-[10px] tracking-[2px] uppercase text-muted mb-1.5 block'

export function AuthModal() {
  const { authOpen, authMode, closeAuth, authenticate, openAuth } = useStore()
  const mode = authMode

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  // Reset errores al cambiar de tab
  useEffect(() => { form.clearErrors() }, [mode, form])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuth() }
    if (authOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [authOpen, closeAuth])

  if (!authOpen) return null

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form

  const onSubmit = (data: FormValues) => {
    authenticate({ name: data.name || data.email.split('@')[0], email: data.email })
    toast.success(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada')
    closeAuth()
  }

  return (
    <div
      onClick={closeAuth}
      className="fixed inset-0 z-300 bg-black/82 backdrop-blur-[10px] flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surf border border-(--bd) max-w-110 w-full relative px-9 py-10"
      >
        <Button variant="icon" size="md" onClick={closeAuth} className="absolute top-3.5 right-3.5">
          <X size={16} />
        </Button>

        {/* Tabs */}
        <div className="flex border border-(--bd) mb-7">
          {(['login', 'register'] as const).map((m) => (
            <Button
              key={m}
              variant="tab"
              size="md"
              active={mode === m}
              onClick={() => { form.reset(); openAuth(m) }}
              className="flex-1"
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          ))}
        </div>

        <div className="font-display text-[32px] font-black uppercase tracking-[-0.5px] leading-none mb-1.5">
          {mode === 'login' ? 'Bienvenido' : 'Únete a Mirana'}
        </div>
        <div className="text-muted text-[13px] mb-6">
          {mode === 'login'
            ? 'Ingresa para acceder a tu cuenta y pedidos'
            : 'Crea una cuenta y desbloquea ofertas exclusivas'}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {mode === 'register' && (
            <div className="mb-3.5">
              <label className={labelCls}>Nombre completo</label>
              <input {...register('name')} className={inputCls} placeholder="Tu nombre" />
              {errors.name && <p className="mt-1 text-[11px] text-[#ff6644]">{errors.name.message}</p>}
            </div>
          )}

          <div className="mb-3.5">
            <label className={labelCls}>Correo electrónico</label>
            <input {...register('email')} type="email" className={inputCls} placeholder="tucorreo@ejemplo.com" />
            {errors.email && <p className="mt-1 text-[11px] text-[#ff6644]">{errors.email.message}</p>}
          </div>

          <div className="mb-3.5">
            <label className={labelCls}>Contraseña</label>
            <input {...register('password')} type="password" className={inputCls} placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-[11px] text-[#ff6644]">{errors.password.message}</p>}
          </div>

          {mode === 'register' && (
            <div className="mb-3.5">
              <label className={labelCls}>Confirmar contraseña</label>
              <input {...register('confirm')} type="password" className={inputCls} placeholder="••••••••" />
              {errors.confirm && <p className="mt-1 text-[11px] text-[#ff6644]">{errors.confirm.message}</p>}
            </div>
          )}

          <div className="flex justify-between items-center text-[12px] text-muted my-1.5 mb-4.5">
            {mode === 'login' ? (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" /> Recordarme
                </label>
                <a className="text-(--gold) cursor-pointer">¿Olvidaste tu contraseña?</a>
              </>
            ) : (
              <span>
                Al registrarte aceptas los <a className="text-(--gold)">Términos</a>
              </span>
            )}
          </div>

          <Button type="submit" variant="accent" size="lg" full disabled={isSubmitting}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5 text-muted text-[11px] tracking-[2px] uppercase">
          <span className="flex-1 h-px bg-(--bd)" /> o continúa con{' '}
          <span className="flex-1 h-px bg-(--bd)" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => { authenticate({ name: 'Usuario Google', email: 'demo@gmail.com' }); toast.success('Sesión iniciada con Google'); closeAuth() }}
            className="flex-1"
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => { authenticate({ name: 'Admin Mirana', email: 'admin@mirana.com' }); toast.success('Demo admin activado'); closeAuth() }}
            className="flex-1"
          >
            <LayoutGrid size={14} />
            Demo Admin
          </Button>
        </div>
      </div>
    </div>
  )
}
