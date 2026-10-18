'use client'

import { registerUser } from '@/features/auth/actions/register.actions'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/schemas/auth.schema'
import { mergeCartOnLoginAction } from '@/features/cart/actions/cart.actions'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { MiranaMark } from '@/shared/components/brand/MiranaLogo'
import { Button } from '@/shared/components/ui/Button'
import { Field } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'
import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, X } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Modal de acceso. Se arma como la caja de una figura: franja navy arriba con
// la ranura para colgar del blíster y el isotipo, y el formulario debajo.
// La personalidad vive en la franja; el formulario es sobrio a propósito.
// ---------------------------------------------------------------------------

// 16px en móvil: con 14px Safari iOS hace zoom al enfocar el campo.
const fieldCls = cn(inputCls, 'text-base sm:text-[14px]')
// Rótulos en minúscula y en tinta de texto: en un formulario corto se leen
// mejor que los rótulos en mayúsculas espaciadas del admin.
const labelCls = 'block text-[13px] font-semibold text-text mb-1.5'

type AuthMode = 'login' | 'register'
type FormValues = LoginInput & Partial<Pick<RegisterInput, 'name' | 'confirm'>>

const COPY: Record<AuthMode, { tab: string; title: string; lead: string; submit: string }> = {
  login: {
    tab: 'Iniciar sesión',
    title: 'Hola de nuevo',
    lead: 'Entra para ver tus pedidos y tus reservas de preventa.',
    submit: 'Iniciar sesión',
  },
  register: {
    tab: 'Crear cuenta',
    title: 'Crea tu cuenta',
    lead: 'Guarda tus direcciones y sigue cada pedido y preventa desde un solo lugar.',
    submit: 'Crear cuenta',
  },
}

const MODES: AuthMode[] = ['login', 'register']

export function AuthModal() {
  const authOpen = useAuthModalStore((s) => s.authOpen)
  const authMode = useAuthModalStore((s) => s.authMode)
  const closeAuth = useAuthModalStore((s) => s.closeAuth)
  const openAuth = useAuthModalStore((s) => s.openAuth)
  const tabsId = useId()
  const copy = COPY[authMode]

  // Pestañas con flechas ←/→ (patrón ARIA tablist con activación automática).
  const onTabsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = authMode === 'login' ? 'register' : 'login'
    openAuth(next)
    document.getElementById(`${tabsId}-${next}`)?.focus()
  }

  return (
    <Modal open={authOpen} onClose={closeAuth} size="md" bare label={copy.tab}>
      <div className="overflow-y-auto">
        {/* ── Franja de marca ── */}
        <header className="relative bg-(--brand-navy) text-on-media px-6 sm:px-8 pt-9 pb-0">
          {/* Ranura del blíster: detalle de empaque, sin función. */}
          <span
            aria-hidden
            className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full bg-black/45 ring-1 ring-white/15"
          />
          <button
            type="button"
            onClick={closeAuth}
            aria-label="Cerrar"
            className="absolute top-2 right-2 grid place-items-center w-11 h-11 text-on-media/70 hover:text-on-media focus-visible:outline-2 focus-visible:outline-(--brand-moon) transition-colors"
          >
            <X size={20} aria-hidden />
          </button>

          <div className="flex items-center gap-4">
            <MiranaMark className="w-12 h-12 [--brand-moon:#00c8ff]" />
            <div className="min-w-0">
              <h2 className="font-display text-[30px] font-black uppercase leading-none tracking-[-0.3px]">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-snug text-on-media/75">{copy.lead}</p>
            </div>
          </div>

          {/* El foco va a cada pestaña (roving tabindex), no al contenedor. */}
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div
            role="tablist"
            aria-label="Tipo de acceso"
            onKeyDown={onTabsKeyDown}
            className="mt-7 -mx-6 sm:-mx-8 px-6 sm:px-8 flex gap-6"
          >
            {MODES.map((m) => {
              const active = authMode === m
              return (
                <button
                  key={m}
                  id={`${tabsId}-${m}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => openAuth(m)}
                  className={cn(
                    'relative pb-3 pt-1 font-display text-[15px] font-bold uppercase tracking-[1px] transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-moon)',
                    active ? 'text-on-media' : 'text-on-media/55 hover:text-on-media/85',
                  )}
                >
                  {COPY[m].tab}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 right-0 bottom-0 h-[3px] bg-(--brand-moon) origin-left transition-transform duration-200 motion-reduce:transition-none',
                      active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </button>
              )
            })}
          </div>
        </header>

        {/* El form se remonta con `key={authMode}`: cambiar de pestaña resetea
            el formulario y los checkboxes sin efectos ni refs (idioma del repo). */}
        <div
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${authMode}`}
          className="px-6 sm:px-8 pt-6 pb-7"
        >
          <AuthForm key={authMode} mode={authMode} onClose={closeAuth} onSwitch={openAuth} />
        </div>
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
  const [googlePending, setGooglePending] = useState(false)
  const errorId = useId()
  const copy = COPY[mode]

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

  const continueWithGoogle = () => {
    setGooglePending(true)
    // Redirección completa: el carrito anónimo se fusiona en el evento signIn
    // del servidor (auth.ts), no aquí.
    void signIn('google', { callbackUrl: window.location.href })
  }

  const busy = isSubmitting || googlePending

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={busy}
        aria-busy={googlePending || undefined}
        className="w-full h-12 inline-flex items-center justify-center gap-3 border border-field bg-card text-text text-[14px] font-semibold hover:bg-card-hover transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {googlePending ? <Spinner size={18} /> : <GoogleIcon />}
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-[12px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-(--bd)" />o con tu correo
        <span className="h-px flex-1 bg-(--bd)" />
      </div>

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
                className="absolute inset-y-0 right-0 w-11 grid place-items-center text-muted hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          )}
        </Field>

        {mode === 'register' && (
          <Field label="Repite la contraseña" error={errors.confirm?.message} labelClassName={labelCls}>
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
                className="mt-0.5 w-4 h-4 shrink-0 accent-(--accent-ink)"
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
          className="mt-1"
        >
          {copy.submit}
        </Button>
      </form>

      <p className="text-center text-[13px] text-muted">
        {mode === 'login' ? '¿Primera vez en Mirana? ' : '¿Ya tienes cuenta? '}
        <button
          type="button"
          onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
          className="font-semibold text-accent-ink underline underline-offset-2 hover:no-underline"
        >
          {mode === 'login' ? 'Crea tu cuenta' : 'Inicia sesión'}
        </button>
      </p>
    </div>
  )
}

/** Logo "G" de Google en sus colores oficiales (requisito de su guía de marca). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}
