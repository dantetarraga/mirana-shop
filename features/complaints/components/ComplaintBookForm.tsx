'use client'

import { createComplaint } from '@/features/complaints/actions/complaint.actions'
import {
  COMPLAINT_SHEET_ID,
  ComplaintSheet,
  PRINT_CSS,
} from '@/features/complaints/components/ComplaintSheet'
import {
  COMPLAINT_TYPE_DEFINITIONS,
  formatLimaDate,
  formatLimaDateTime,
  providerRows,
  STORE_DISPLAY_NAME,
  type ComplaintSheetData,
  type ProviderInfo,
} from '@/features/complaints/lib/complaint-sheet'
import {
  createComplaintSchema,
  DOC_TYPE_LABELS,
  DOC_TYPES,
  MAX_CLAIMED_AMOUNT,
  type CreateComplaintInput,
} from '@/features/complaints/schemas/complaint.schema'
import { input } from '@/features/checkout/components/ui'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Printer, Send } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Hoja de Reclamación Virtual (Anexo I del D.S. 011-2011-PCM). Campos
// obligatorios marcados con *, errores inline anunciados (role="alert") y
// asociados a su control con aria-describedby.
// ---------------------------------------------------------------------------

type FieldName = FieldPath<CreateComplaintInput>

const DOC_HINTS: Record<string, string> = {
  DNI: '8 dígitos',
  CE: '9 a 12 caracteres alfanuméricos',
  PASAPORTE: '6 a 12 caracteres alfanuméricos',
}

const fieldId = (name: string) => `lr-${name}`

function FormRow({
  name,
  label,
  required,
  error,
  hint,
  span,
  children,
}: {
  name: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  span?: 2
  children: React.ReactNode
}) {
  const id = fieldId(name)
  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="block text-[10px] tracking-[2px] uppercase text-accent-ink mb-1.5">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger ml-0.5">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-muted text-[11px] mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-danger text-[12px] mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

const sectionCls = 'bg-card border border-(--bd) p-5 sm:p-6'
const sectionTitleCls =
  'font-display font-black uppercase text-[14px] tracking-[2px] text-accent-ink mb-5'

type SuccessState = { sheet: ComplaintSheetData; emailSent: boolean }

interface ComplaintBookFormProps {
  provider: ProviderInfo
  /** Fecha del servidor (ISO) para mostrar la fecha de la hoja sin desfase */
  todayIso: string
}

export function ComplaintBookForm({ provider, todayIso }: ComplaintBookFormProps) {
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      docType: 'DNI',
      type: 'RECLAMO',
      goodType: 'PRODUCTO',
      isMinor: false,
      truthDeclarationAccepted: false,
      privacyAccepted: false,
      extraInfo: '',
    },
  })

  const docType = useWatch({ control, name: 'docType' })
  const guardianDocType = useWatch({ control, name: 'guardianDocType' })
  const isMinor = useWatch({ control, name: 'isMinor' })

  useEffect(() => {
    if (success) successHeadingRef.current?.focus()
  }, [success])

  /** Props de accesibilidad comunes a cada control. */
  const a11y = (name: FieldName, opts: { required?: boolean; hint?: boolean } = {}) => {
    const id = fieldId(name)
    const hasError = Boolean(errors[name as keyof typeof errors])
    const describedBy = [opts.hint && `${id}-hint`, hasError && `${id}-error`]
      .filter(Boolean)
      .join(' ')
    return {
      id,
      'aria-invalid': hasError || undefined,
      'aria-required': opts.required || undefined,
      'aria-describedby': describedBy || undefined,
    }
  }

  const onSubmit = async (data: CreateComplaintInput) => {
    setServerError(null)
    let result: Awaited<ReturnType<typeof createComplaint>>
    try {
      result = await createComplaint(data)
    } catch {
      result = {
        success: false,
        error: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
        code: 500,
      }
    }

    if (!result.success) {
      if ('fieldErrors' in result) {
        const entries = Object.entries(result.fieldErrors) as [FieldName, string][]
        for (const [name, message] of entries) setError(name, { type: 'server', message })
        if (entries[0]) setFocus(entries[0][0])
      }
      setServerError(result.error)
      toast.error(result.error)
      return
    }

    setSuccess({
      emailSent: result.data.emailSent,
      sheet: {
        ...data,
        code: result.data.code,
        createdAt: result.data.createdAt,
        dueAt: result.data.dueAt,
        claimedAmount: data.claimedAmount || null,
      },
    })
    reset()
  }

  if (success) {
    const { sheet, emailSent } = success
    return (
      <div className="flex flex-col gap-6">
        <style>{PRINT_CSS}</style>
        <div className="bg-card border border-(--bd) px-6 py-10 flex flex-col items-center text-center gap-4 print:hidden">
          <div className="w-16 h-16 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center">
            <BadgeCheck size={32} className="text-accent-ink" aria-hidden="true" />
          </div>
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="font-display font-black uppercase text-[22px] tracking-tight outline-none"
          >
            {sheet.type === 'QUEJA' ? 'Queja registrada' : 'Reclamo registrado'}
          </h2>
          <p className="text-muted text-[13px] max-w-md">
            Tu hoja quedó registrada con el código{' '}
            <span className="font-mono text-accent-ink">{sheet.code}</span> el{' '}
            {formatLimaDateTime(sheet.createdAt)} (hora de Lima). Te responderemos a{' '}
            <span className="text-text">{sheet.email}</span> en un plazo no mayor a 15 días hábiles,
            improrrogable (hasta el {formatLimaDate(sheet.dueAt)}).
          </p>
          <p role="status" className="text-[13px] max-w-md">
            {emailSent
              ? `Te enviamos una copia de esta hoja a ${sheet.email}.`
              : 'No pudimos enviarte la copia por correo en este momento. Imprime o guarda esta hoja como constancia; te la reenviaremos al correo indicado.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="accent"
              size="md"
              onClick={() => window.print()}
              aria-controls={COMPLAINT_SHEET_ID}
            >
              <Printer size={15} className="mr-2" aria-hidden="true" />
              Imprimir / Guardar hoja
            </Button>
            <Button variant="outline" size="md" onClick={() => setSuccess(null)}>
              Registrar otro reclamo
            </Button>
          </div>
        </div>

        <ComplaintSheet data={sheet} provider={provider} />
      </div>
    )
  }

  const docHint = DOC_HINTS[docType] ?? undefined
  const guardianHint = guardianDocType ? DOC_HINTS[guardianDocType] : undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6" aria-describedby="lr-required-legend">
      {/* Cabecera de la hoja: datos del proveedor, fecha y número */}
      <section className={sectionCls} aria-labelledby="lr-sheet-title">
        <h2 id="lr-sheet-title" className={sectionTitleCls}>
          Hoja de Reclamación
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
          {[{ label: 'Nombre comercial', value: STORE_DISPLAY_NAME }, ...providerRows(provider)].map(
            (r) => (
              <div key={r.label} className="flex gap-2">
                <dt className="text-muted shrink-0">{r.label}:</dt>
                <dd className="font-semibold">{r.value}</dd>
              </div>
            ),
          )}
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Fecha:</dt>
            <dd className="font-semibold">
              <time dateTime={todayIso}>{formatLimaDate(todayIso)}</time>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Hoja Nº:</dt>
            <dd className="font-semibold">Se asigna al enviar</dd>
          </div>
        </dl>
        <p id="lr-required-legend" className="text-[12px] text-muted mt-4">
          Los campos marcados con <span className="text-danger" aria-hidden="true">*</span>
          <span className="sr-only">asterisco</span> son obligatorios.
        </p>
      </section>

      <section className={sectionCls} aria-labelledby="lr-s1">
        <h2 id="lr-s1" className={sectionTitleCls}>
          1. Identificación del consumidor reclamante
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormRow name="fullName" label="Nombre completo" required error={errors.fullName?.message} span={2}>
            <input
              {...register('fullName')}
              {...a11y('fullName', { required: true })}
              autoComplete="name"
              className={input}
              placeholder="Juan García Pérez"
            />
          </FormRow>

          <FormRow name="docType" label="Tipo de documento" required error={errors.docType?.message}>
            <select {...register('docType')} {...a11y('docType', { required: true })} className={input}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            name="docNumber"
            label="Número de documento"
            required
            error={errors.docNumber?.message}
            hint={docHint}
          >
            <input
              {...register('docNumber')}
              {...a11y('docNumber', { required: true, hint: Boolean(docHint) })}
              inputMode={docType === 'DNI' ? 'numeric' : 'text'}
              maxLength={12}
              autoComplete="off"
              className={input}
              placeholder={docType === 'DNI' ? '12345678' : ''}
            />
          </FormRow>

          <FormRow name="address" label="Domicilio" required error={errors.address?.message} span={2}>
            <input
              {...register('address')}
              {...a11y('address', { required: true })}
              autoComplete="street-address"
              className={input}
              placeholder="Av. Principal 123, Dpto. 4B, Arequipa"
            />
          </FormRow>

          <FormRow name="phone" label="Teléfono" required error={errors.phone?.message}>
            <input
              {...register('phone')}
              {...a11y('phone', { required: true })}
              type="tel"
              autoComplete="tel"
              className={input}
              placeholder="+51 999 999 999"
            />
          </FormRow>

          <FormRow name="email" label="Correo electrónico" required error={errors.email?.message}>
            <input
              {...register('email')}
              {...a11y('email', { required: true })}
              type="email"
              autoComplete="email"
              className={input}
              placeholder="tu@correo.com"
            />
          </FormRow>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input {...register('isMinor')} id={fieldId('isMinor')} type="checkbox" className="accent-accent-ink" />
              Soy menor de edad
            </label>
          </div>

          {isMinor && (
            <fieldset className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-(--bd) p-4">
              <legend className="px-1 text-[11px] tracking-[1.5px] uppercase text-muted">
                Datos del padre, madre o apoderado
              </legend>
              <FormRow
                name="guardianName"
                label="Nombre completo del apoderado"
                required
                error={errors.guardianName?.message}
                span={2}
              >
                <input
                  {...register('guardianName')}
                  {...a11y('guardianName', { required: true })}
                  className={input}
                />
              </FormRow>
              <FormRow
                name="guardianDocType"
                label="Tipo de documento"
                required
                error={errors.guardianDocType?.message}
              >
                <select
                  {...register('guardianDocType', { setValueAs: (v) => (v === '' ? undefined : v) })}
                  {...a11y('guardianDocType', { required: true })}
                  className={input}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Elige…
                  </option>
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DOC_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow
                name="guardianDocNumber"
                label="Número de documento"
                required
                error={errors.guardianDocNumber?.message}
                hint={guardianHint}
              >
                <input
                  {...register('guardianDocNumber')}
                  {...a11y('guardianDocNumber', { required: true, hint: Boolean(guardianHint) })}
                  maxLength={12}
                  className={input}
                />
              </FormRow>
            </fieldset>
          )}
        </div>
      </section>

      <section className={sectionCls} aria-labelledby="lr-s2">
        <h2 id="lr-s2" className={sectionTitleCls}>
          2. Identificación del bien contratado
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset
            className="sm:col-span-2"
            aria-invalid={errors.goodType ? true : undefined}
            aria-describedby={errors.goodType ? 'lr-goodType-error' : undefined}
          >
            <legend className="block text-[10px] tracking-[2px] uppercase text-accent-ink mb-1.5">
              Bien contratado
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </legend>
            <div className="flex gap-5 flex-wrap">
              {(['PRODUCTO', 'SERVICIO'] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input {...register('goodType')} type="radio" value={v} className="accent-accent-ink" />
                  {v === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                </label>
              ))}
            </div>
            {errors.goodType && (
              <p id="lr-goodType-error" role="alert" className="text-danger text-[12px] mt-1">
                {errors.goodType.message}
              </p>
            )}
          </fieldset>

          <FormRow
            name="orderCode"
            label="Nº de pedido (opcional)"
            error={errors.orderCode?.message}
            hint="Si compraste en la tienda, ej. MIR-2026-0001"
          >
            <input
              {...register('orderCode', { setValueAs: (v: string) => (v ? v : undefined) })}
              {...a11y('orderCode', { hint: true })}
              maxLength={40}
              autoComplete="off"
              className={input}
              placeholder="MIR-2026-0001"
            />
          </FormRow>

          <FormRow
            name="claimedAmount"
            label="Monto reclamado (S/, opcional)"
            error={errors.claimedAmount?.message}
            hint={`Hasta S/ ${MAX_CLAIMED_AMOUNT.toLocaleString('es-PE')}`}
          >
            <input
              {...register('claimedAmount')}
              {...a11y('claimedAmount', { hint: true })}
              type="number"
              min={0}
              max={MAX_CLAIMED_AMOUNT}
              step="0.01"
              inputMode="decimal"
              className={input}
              placeholder="0.00"
            />
          </FormRow>

          <FormRow
            name="productDescription"
            label="Descripción del producto o servicio"
            required
            error={errors.productDescription?.message}
            span={2}
          >
            <input
              {...register('productDescription')}
              {...a11y('productDescription', { required: true })}
              className={input}
              placeholder="Ej. Figura de colección LEGO Star Wars 75375"
            />
          </FormRow>
        </div>
      </section>

      <section className={sectionCls} aria-labelledby="lr-s3">
        <h2 id="lr-s3" className={sectionTitleCls}>
          3. Detalle de la reclamación y pedido del consumidor
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <fieldset
            aria-invalid={errors.type ? true : undefined}
            aria-describedby={errors.type ? 'lr-type-error' : undefined}
          >
            <legend className="block text-[10px] tracking-[2px] uppercase text-accent-ink mb-1.5">
              Tipo
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </legend>
            <div className="flex flex-col gap-3">
              {(['RECLAMO', 'QUEJA'] as const).map((v) => (
                <label key={v} className="flex items-start gap-2 text-[13px] cursor-pointer">
                  <input
                    {...register('type')}
                    type="radio"
                    value={v}
                    className="accent-accent-ink mt-1"
                    aria-describedby={`lr-type-def-${v}`}
                  />
                  <span>
                    <span className="font-semibold">{v === 'RECLAMO' ? 'Reclamo' : 'Queja'}</span>
                    <span id={`lr-type-def-${v}`} className="block text-muted text-[12px]">
                      {COMPLAINT_TYPE_DEFINITIONS[v]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p id="lr-type-error" role="alert" className="text-danger text-[12px] mt-1">
                {errors.type.message}
              </p>
            )}
          </fieldset>

          <FormRow name="detail" label="Detalle" required error={errors.detail?.message}>
            <textarea
              {...register('detail')}
              {...a11y('detail', { required: true })}
              rows={5}
              className={input}
              placeholder="Describe lo ocurrido con el mayor detalle posible..."
            />
          </FormRow>

          <FormRow name="request" label="Pedido del consumidor" required error={errors.request?.message}>
            <textarea
              {...register('request')}
              {...a11y('request', { required: true })}
              rows={3}
              className={input}
              placeholder="Ej. Solicito el cambio del producto / la devolución de mi dinero..."
            />
          </FormRow>
        </div>
      </section>

      <section className={cn(sectionCls, 'flex flex-col gap-3')} aria-label="Declaraciones">
        <div>
          <label className="flex items-start gap-2 text-[13px] cursor-pointer">
            <input
              {...register('truthDeclarationAccepted')}
              {...a11y('truthDeclarationAccepted', { required: true })}
              type="checkbox"
              className="accent-accent-ink mt-1"
            />
            <span>
              Declaro que la información proporcionada es verdadera.
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </span>
          </label>
          {errors.truthDeclarationAccepted && (
            <p id="lr-truthDeclarationAccepted-error" role="alert" className="text-danger text-[12px] mt-1">
              {errors.truthDeclarationAccepted.message}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2 text-[13px] cursor-pointer">
            <input
              {...register('privacyAccepted')}
              {...a11y('privacyAccepted', { required: true })}
              type="checkbox"
              className="accent-accent-ink mt-1"
            />
            <span>
              Autorizo el tratamiento de mis datos personales para registrar y atender esta hoja,
              conforme a la Ley 29733 y la{' '}
              <Link href="/politica-de-privacidad" target="_blank" className="underline text-accent-ink">
                Política de Privacidad
              </Link>
              .
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </span>
          </label>
          {errors.privacyAccepted && (
            <p id="lr-privacyAccepted-error" role="alert" className="text-danger text-[12px] mt-1">
              {errors.privacyAccepted.message}
            </p>
          )}
        </div>

        <p className="text-[12px] text-muted">
          El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a quince (15)
          días hábiles, el cual es improrrogable. Recibirás una copia de esta hoja en tu correo.
        </p>
      </section>

      {/* Honeypot: invisible para personas y lectores de pantalla; los bots lo rellenan */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor={fieldId('extraInfo')}>No completar este campo</label>
        <input {...register('extraInfo')} id={fieldId('extraInfo')} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {serverError && (
        <div role="alert" className="border border-danger/40 bg-danger/5 text-danger text-[13px] px-4 py-3">
          {serverError}
        </div>
      )}

      <Button
        variant="accent"
        size="lg"
        full
        type="submit"
        loading={isSubmitting}
        loadingText="Enviando hoja de reclamación…"
      >
        <Send size={15} className="mr-2" aria-hidden="true" />
        Enviar hoja de reclamación
      </Button>
    </form>
  )
}
