'use client'

import { acceptTerms } from '@/features/auth/actions/accept-terms.actions'
import { registerUser } from '@/features/auth/actions/register.actions'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { mergeCartOnLoginAction } from '@/features/cart/actions/cart.actions'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Modal } from '@/shared/components/ui/Modal'
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/schemas/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormValues = LoginInput & Partial<Pick<RegisterInput, 'name' | 'confirm'>>

export function AuthModal() {
  const { authOpen, authMode, closeAuth, openAuth } = useAuthModalStore()
  const mode = authMode
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  useEffect(() => {
    form.clearErrors()
    setTermsAccepted(false)
    setTermsError(false)
  }, [mode, form])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit = async (data: FormValues) => {
    if (mode === 'register' && !termsAccepted) {
      setTermsError(true)
      return
    }

    if (mode === 'register') {
      const result = await registerUser({
        name: data.name!,
        email: data.email,
        password: data.password,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      await acceptTerms(data.email)
    }

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (res?.error) {
      toast.warning('Correo o contraseña incorrectos')
      return
    }

    toast.success(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada')
    form.reset()
    closeAuth()

    // No hay recarga de página (signIn con redirect:false) — fusiona el
    // carrito anónimo a la cuenta y refresca el store manualmente.
    mergeCartOnLoginAction()
      .then((cart) => useCartStore.getState().hydrateCart(cart))
      .catch(() => {})
  }

  return (
    <Modal open={authOpen} onClose={closeAuth} size="md" hideClose={true}>
      {/* Tabs */}
      <div className="flex border border-(--bd) mb-6 -mx-8">
        {(['login', 'register'] as const).map((m) => (
          <Button
            key={m}
            variant="tab"
            size="md"
            active={mode === m}
            onClick={() => {
              form.reset()
              openAuth(m)
            }}
            className="flex-1"
          >
            {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        ))}
      </div>

      {/* Título y subtítulo */}
      <div className="font-display text-[30px] font-black uppercase tracking-[-0.5px] leading-none mb-1.5">
        {mode === 'login' ? 'Bienvenido' : 'Únete a Mirana'}
      </div>
      <div className="text-muted text-[13px] mb-6 font-sans normal-case tracking-normal">
        {mode === 'login'
          ? 'Ingresa para acceder a tu cuenta y pedidos'
          : 'Crea una cuenta y desbloquea ofertas exclusivas'}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5">
        {mode === 'register' && (
          <FormField label="Nombre completo" error={errors.name?.message}>
            <input {...register('name')} className="adm-input" placeholder="Tu nombre" />
          </FormField>
        )}

        <FormField label="Correo electrónico" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className="adm-input"
            placeholder="tucorreo@ejemplo.com"
          />
        </FormField>

        <FormField label="Contraseña" error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            className="adm-input"
            placeholder="••••••••"
          />
        </FormField>

        {mode === 'register' && (
          <FormField label="Confirmar contraseña" error={errors.confirm?.message}>
            <input
              {...register('confirm')}
              type="password"
              className="adm-input"
              placeholder="••••••••"
            />
          </FormField>
        )}

        {/* "Recordarme" y recuperación de contraseña ocultos hasta tener flujo
            real (la sesión JWT ya persiste por defecto; el reset requiere email)
        {mode === 'login' && (
          <div className="flex justify-between items-center text-[12px] text-muted mt-0.5 mb-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" /> Recordarme
            </label>
            <a className="text-(--gold) cursor-pointer">¿Olvidaste tu contraseña?</a>
          </div>
        )}
        */}

        {mode === 'register' && (
          <div className="mt-0.5 mb-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-[12px] text-muted font-sans normal-case tracking-normal">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked)
                  if (e.target.checked) setTermsError(false)
                }}
                className="mt-0.5 shrink-0 accent-(--gold)"
              />
              <span>
                He leído y acepto los{' '}
                <a
                  href="/terminos-y-condiciones"
                  target="_blank"
                  className="text-(--gold) underline underline-offset-2"
                >
                  Términos y Condiciones
                </a>{' '}
                y la{' '}
                <a
                  href="/politica-de-privacidad"
                  target="_blank"
                  className="text-(--gold) underline underline-offset-2"
                >
                  Política de Privacidad
                </a>{' '}
                de Mirana Shop.
              </span>
            </label>
            {termsError && (
              <p className="mt-1.5 text-[11px] text-[#ff6644]">
                Debes aceptar los Términos y Condiciones para continuar.
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" full disabled={isSubmitting}>
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </Button>

        <Button type="button" variant="ghost" size="md" full onClick={closeAuth}>
          Cancelar
        </Button>
      </form>

      {/* OAuth — botón de Google deshabilitado temporalmente
      <div className="flex items-center gap-3 my-5 text-muted text-[11px] tracking-[2px] uppercase">
        <span className="flex-1 h-px bg-(--bd)" /> o continúa con{' '}
        <span className="flex-1 h-px bg-(--bd)" />
      </div>

      <Button variant="outline" size="md" full onClick={() => signIn('google')}>
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>
      */}
    </Modal>
  )
}
