'use client'

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
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type AuthMode = 'login' | 'register'
type FormValues = LoginInput & Partial<Pick<RegisterInput, 'name' | 'confirm'>>

export function AuthModal() {
  const { authOpen, authMode, closeAuth, openAuth } = useAuthModalStore()

  return (
    <Modal open={authOpen} onClose={closeAuth} size="md" hideClose={true}>
      {/* Tabs */}
      <div className="flex border border-(--bd) mb-6 -mx-5 sm:-mx-8">
        {(['login', 'register'] as const).map((m) => (
          <Button
            key={m}
            variant="tab"
            size="md"
            active={authMode === m}
            onClick={() => openAuth(m)}
            className="flex-1"
          >
            {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        ))}
      </div>

      {/* El form se remonta con `key={authMode}`: cambiar de tab resetea el
          formulario y los checkboxes sin efectos ni refs (idioma del repo). */}
      <AuthForm key={authMode} mode={authMode} onClose={closeAuth} />
    </Modal>
  )
}

function AuthForm({ mode, onClose }: { mode: AuthMode; onClose: () => void }) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  const onSubmit = async (data: FormValues) => {
    if (mode === 'register' && !termsAccepted) {
      setTermsError(true)
      return
    }

    if (mode === 'register') {
      // La aceptación de términos se registra dentro de registerUser (atómico).
      const result = await registerUser({
        name: data.name!,
        email: data.email,
        password: data.password,
        confirm: data.confirm,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
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
    reset()
    onClose()

    // No hay recarga de página (signIn con redirect:false) — fusiona el
    // carrito anónimo a la cuenta y refresca el store manualmente.
    mergeCartOnLoginAction()
      .then((cart) => useCartStore.getState().hydrateCart(cart))
      .catch(() => {})
  }

  return (
    <>
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

        <Button type="button" variant="ghost" size="md" full onClick={onClose}>
          Cancelar
        </Button>
      </form>
    </>
  )
}
