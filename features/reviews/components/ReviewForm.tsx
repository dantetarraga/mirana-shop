'use client'

import { submitReview } from '@/features/reviews/actions/review.actions'
import { ReviewStars } from '@/features/reviews/components/ReviewStars'
import { StarPicker } from '@/features/reviews/components/StarPicker'
import { MY_REVIEW_STATUS } from '@/features/reviews/lib/review-status'
import {
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  REVIEW_TITLE_MAX,
  reviewInputSchema,
} from '@/features/reviews/schemas/review.schema'
import type { MyReview } from '@/features/reviews/types'
import { Button } from '@/shared/components/ui/Button'
import { Field } from '@/shared/components/ui/Field'
import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { PenLine } from 'lucide-react'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'

interface ReviewFormProps {
  productId: string
  productName: string
  initialReview: MyReview | null
  /** Texto de invitación sobre el botón (se omite si la sección ya invita). */
  intro?: boolean
}

type FieldErrors = Partial<Record<'rating' | 'title' | 'body', string>>

const THANKS = 'Gracias, tu reseña se publicará cuando la revisemos.'

/**
 * Escribir o editar la reseña propia. Sin reseña: un botón que despliega el
 * formulario. Con reseña: su estado ("En revisión", "Publicada", "No
 * publicada") y la opción de editarla, que la devuelve a moderación.
 */
export function ReviewForm({ productId, productName, initialReview, intro = true }: ReviewFormProps) {
  const [review, setReview] = useState<MyReview | null>(initialReview)
  const [editing, setEditing] = useState(false)
  const [justSent, setJustSent] = useState(false)

  if (editing) {
    return (
      <ReviewFormFields
        productId={productId}
        productName={productName}
        initial={review}
        onCancel={() => setEditing(false)}
        onSaved={(saved) => {
          setReview(saved)
          setEditing(false)
          setJustSent(true)
        }}
      />
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-start gap-3">
        {intro && (
          <p className="text-[14px] text-muted max-w-[44ch]">
            ¿Ya lo tienes? Tu opinión ayuda a otros coleccionistas a decidir.
          </p>
        )}
        <Button variant="accent" size="md" clip onClick={() => setEditing(true)}>
          <PenLine size={16} aria-hidden />
          Escribir una opinión
        </Button>
      </div>
    )
  }

  const meta = MY_REVIEW_STATUS[review.status]
  return (
    <div className="border border-(--bd) bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-[13px] font-semibold text-text">Tu opinión</span>
        <span className={cn('text-[10px] tracking-[1px] uppercase px-2 py-1', meta.className)}>
          {meta.label}
        </span>
      </div>
      <ReviewStars value={review.rating} />
      {review.title && <p className="mt-2 text-[14px] font-bold text-text wrap-break-word">{review.title}</p>}
      <p className="mt-1 text-[13px] text-muted line-clamp-3 whitespace-pre-line wrap-break-word">
        {review.body}
      </p>
      <p role="status" className="mt-3 text-[13px] text-text">
        {justSent ? THANKS : meta.hint}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditing(true)}>
        Editar mi opinión
      </Button>
    </div>
  )
}

function ReviewFormFields({
  productId,
  productName,
  initial,
  onCancel,
  onSaved,
}: {
  productId: string
  productName: string
  initial: MyReview | null
  onCancel: () => void
  onSaved: (review: MyReview) => void
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Al abrir, el foco entra en el selector de estrellas.
  useEffect(() => {
    const form = formRef.current
    ;(
      form?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ??
      form?.querySelector<HTMLInputElement>('input[type="radio"]')
    )?.focus()
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const input = { productId, rating, title, body }
    const parsed = reviewInputSchema.safeParse(input)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await submitReview(input).catch(() => null)
      if (!result) {
        setFormError('No se pudo enviar tu reseña. Revisa tu conexión e inténtalo de nuevo.')
        return
      }
      if (!result.success) {
        if ('fieldErrors' in result) setErrors(result.fieldErrors as FieldErrors)
        setFormError(result.error)
        return
      }
      onSaved(result.data.review)
    })
  }

  const bodyLength = body.trim().length

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Tu opinión sobre ${productName}`}
      className="border border-(--bd) bg-card p-5 flex flex-col gap-5 animate-fade-in"
    >
      <StarPicker value={rating} onChange={setRating} error={errors.rating} />

      <Field label="Título" hint="Opcional. Resume tu opinión en una frase." error={errors.title}>
        <input
          type="text"
          value={title}
          maxLength={REVIEW_TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: Los acabados superaron lo que esperaba"
          className={inputCls}
          autoComplete="off"
        />
      </Field>

      <div>
        <Field
          label="Tu opinión"
          required
          error={errors.body}
          hint={`Entre ${REVIEW_BODY_MIN} y ${REVIEW_BODY_MAX} caracteres. Cuenta qué tal la calidad, el empaque o la entrega.`}
        >
          <textarea
            value={body}
            rows={5}
            maxLength={REVIEW_BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            className={cn(inputCls, 'resize-y min-h-32 leading-relaxed')}
          />
        </Field>
        <p
          aria-hidden
          className={cn(
            'mt-1 text-right text-[11px] tabular-nums',
            bodyLength > 0 && bodyLength < REVIEW_BODY_MIN ? 'text-warning' : 'text-muted',
          )}
        >
          {bodyLength}/{REVIEW_BODY_MAX}
        </p>
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-danger">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" size="md" clip loading={isPending} loadingText="Enviando tu opinión">
          {initial ? 'Enviar cambios' : 'Enviar opinión'}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
      <p className="text-[12px] text-muted -mt-2">
        Revisamos cada opinión antes de publicarla. Solo mostramos tu nombre y la inicial de tu apellido.
      </p>
    </form>
  )
}
