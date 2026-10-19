'use client'

import { registerUser } from '@/features/auth/actions/register.actions'
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/schemas/auth.schema'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { mergeCartOnLoginAction } from '@/features/cart/actions/cart.actions'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { MiranaLogo } from '@/shared/components/brand/MiranaLogo'
import { Button } from '@/shared/components/ui/Button'
import { Field } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
// import { Spinner } from '@/shared/components/ui/Spinner' // con Google
import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, X } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

// 16px en móvil: con 14px Safari iOS hace zoom al enfocar el campo.
const fieldCls = cn(
  inputCls,
  'h-12 rounded-md text-base sm:text-[14px] focus:ring-2 focus:ring-ring/15',
)
const labelCls = 'block text-[13px] font-semibold text-text mb-1.5'

type AuthMode = 'login' | 'register'
type FormValues = LoginInput & Partial<Pick<RegisterInput, 'name' | 'confirm'>>

const COPY: Record<AuthMode, { title: string; lead: string; submit: string }> = {
  login: {
    title: 'Inicia sesión',
    lead: 'Tus pedidos y preventas, en un solo lugar.',
    submit: 'Iniciar sesión',
  },
  register: {
    title: 'Crea tu cuenta',
    lead: 'Guarda tus datos y sigue cada pedido de tu colección.',
    submit: 'Crear cuenta',
  },
}

// La cabecera conserva el navy y los colores del logo en ambos temas.
const ON_NAVY_BRAND = '[--brand-moon:#00c8ff] [--brand-slate:#5d7389]'

export function AuthModal() {
  const authOpen = useAuthModalStore((s) => s.authOpen)
  const authMode = useAuthModalStore((s) => s.authMode)
  const closeAuth = useAuthModalStore((s) => s.closeAuth)
  const openAuth = useAuthModalStore((s) => s.openAuth)
  const copy = COPY[authMode]

  return (
    <Modal
      open={authOpen}
      onClose={closeAuth}
      size="md"
      bare
      label={copy.title}
      className="overflow-hidden rounded-xl shadow-premium"
    >
      <div className="relative shrink-0 bg-(--brand-navy) px-14 py-5 text-on-media">
        <MiranaLogo className={cn('mx-auto h-12 w-auto max-w-full', ON_NAVY_BRAND)} />
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Cerrar"
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-md text-on-media/70 transition-colors hover:bg-white/10 hover:text-on-media focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 pt-6 sm:px-9 sm:pb-8">
        <div className="mb-6 text-center">
          <h2 className="font-display text-[34px] font-bold leading-tight tracking-[-0.4px] text-text">
            {copy.title}
          </h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-[13px] leading-relaxed text-muted">
            {copy.lead}
          </p>
        </div>

        {/* El enlace al pie es el único selector de modo. La key limpia los
            campos y el consentimiento al cambiar entre acceso y registro. */}
        <AuthForm key={authMode} mode={authMode} onClose={closeAuth} onSwitch={openAuth} />
      </div>
    </Modal>
  )
}

function AuthForm({
  mode,
  onClose,
  onSwitch,
}: {
  mode: AuthMode
  onClose: () => void
  onSwitch: (mode: AuthMode) => void
}) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Con Google activo: const [googlePending, setGooglePending] = useState(false)
  const googlePending = false
  const errorId = useId()
  const copy = COPY[mode]

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  // Al cambiar de modo, el enlace que tenía foco se desmonta con el formulario.
  useEffect(() => {
    setFocus(mode === 'login' ? 'email' : 'name')
  }, [mode, setFocus])

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
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
        setFormError(result.error)
        return
      }
    }

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (res?.error) {
      // Mismo mensaje para correo inexistente, contraseña errada o límite de
      // intentos: no revela qué cuentas existen.
      setFormError('El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.')
      return
    }

    toast.success(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada')
    reset()
    onClose()

    // No hay recarga de página (signIn con redirect:false): fusiona el
    // carrito anónimo a la cuenta y refresca el store manualmente.
    mergeCartOnLoginAction()
      .then((cart) => useCartStore.getState().hydrateCart(cart))
      .catch(() => {})
  }

  // Inicio de sesión con Google desactivado por ahora (ver auth.ts). Para
  // reactivarlo, descomentar esto, el botón de abajo, GoogleIcon y el
  // proveedor en auth.ts.
  // const continueWithGoogle = () => {
  //   setGooglePending(true)
  //   // Redirección completa: el carrito anónimo se fusiona en el evento signIn
  //   // del servidor (auth.ts), no aquí.
  //   void signIn('google', { callbackUrl: window.location.href })
  // }

  const busy = isSubmitting || googlePending

  return (
    <div className="flex flex-col gap-5">
      {/* Google desactivado por ahora (ver continueWithGoogle arriba).
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={busy}
        aria-busy={googlePending || undefined}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md border border-field bg-card text-[14px] font-semibold text-text transition-colors hover:bg-card-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {googlePending ? <Spinner size={18} /> : <GoogleIcon />}
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-[12px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-(--bd)" />o con tu correo
        <span className="h-px flex-1 bg-(--bd)" />
      </div>
      */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-describedby={formError ? errorId : undefined}
        className="flex flex-col gap-4"
      >
        {formError && (
          <p
            id={errorId}
            role="alert"
            className="border-l-[3px] border-danger bg-danger/10 px-3.5 py-2.5 text-[13px] leading-snug text-text"
          >
            {formError}
          </p>
        )}

        {mode === 'register' && (
          <Field label="Nombre" error={errors.name?.message} labelClassName={labelCls}>
            {(a11y) => (
              <input
                {...register('name')}
                {...a11y}
                data-autofocus
                className={fieldCls}
                placeholder="Como figura en tu DNI"
                autoComplete="name"
                autoCapitalize="words"
              />
            )}
          </Field>
        )}

        <Field label="Correo electrónico" error={errors.email?.message} labelClassName={labelCls}>
          {(a11y) => (
            <input
              {...register('email')}
              {...a11y}
              data-autofocus={mode === 'login' || undefined}
              type="email"
              inputMode="email"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              autoCapitalize="none"
              spellCheck={false}
              className={fieldCls}
              placeholder="tucorreo@ejemplo.com"
            />
          )}
        </Field>

        <Field
          label="Contraseña"
          error={errors.password?.message}
          hint={mode === 'register' ? 'Mínimo 8 caracteres.' : undefined}
          labelClassName={labelCls}
        >
          {(a11y) => (
            <div className="relative">
              <input
                {...register('password')}
                {...a11y}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={cn(fieldCls, 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          )}
        </Field>

        {mode === 'register' && (
          <Field
            label="Repite la contraseña"
            error={errors.confirm?.message}
            labelClassName={labelCls}
          >
            {(a11y) => (
              <input
                {...register('confirm')}
                {...a11y}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={fieldCls}
              />
            )}
          </Field>
        )}

        {mode === 'register' && (
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer text-[13px] leading-snug text-muted">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked)
                  if (e.target.checked) setTermsError(false)
                }}
                aria-invalid={termsError || undefined}
                aria-describedby={termsError ? 'auth-terms-error' : undefined}
                className="mt-0.5 w-4 h-4 shrink-0 accent-accent-ink"
              />
              <span>
                Acepto los{' '}
                <a
                  href="/terminos-y-condiciones"
                  target="_blank"
                  className="text-accent-ink underline underline-offset-2"
                >
                  Términos y Condiciones
                </a>{' '}
                y la{' '}
                <a
                  href="/politica-de-privacidad"
                  target="_blank"
                  className="text-accent-ink underline underline-offset-2"
                >
                  Política de Privacidad
                </a>
                .
              </span>
            </label>
            {termsError && (
              <p id="auth-terms-error" role="alert" className="mt-1.5 text-[12px] text-danger">
                Acepta los Términos y Condiciones para crear tu cuenta.
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          full
          loading={isSubmitting}
          disabled={googlePending}
          className="mt-1 h-12 rounded-md font-sans text-[14px] font-bold normal-case tracking-normal"
        >
          {copy.submit}
        </Button>
      </form>

      <p className="border-t border-border pt-4 text-center text-[13px] leading-relaxed text-muted">
        {mode === 'login' ? '¿Primera vez en Mirana? ' : '¿Ya tienes cuenta? '}
        <button
          type="button"
          onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
          disabled={busy}
          className="inline-flex min-h-9 items-center rounded-sm font-semibold text-accent-ink underline underline-offset-4 hover:no-underline disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {mode === 'login' ? 'Crea tu cuenta' : 'Inicia sesión'}
        </button>
      </p>
    </div>
  )
}

// /** Logo "G" de Google en sus colores oficiales (requisito de su guía de marca). */
// function GoogleIcon() {
//   return (
//     <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden focusable="false">
//       <path
//         fill="#FFC107"
//         d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
//       />
//       <path
//         fill="#FF3D00"
//         d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
//       />
//       <path
//         fill="#4CAF50"
//         d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
//       />
//       <path
//         fill="#1976D2"
//         d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
//       />
//     </svg>
//   )
// }
