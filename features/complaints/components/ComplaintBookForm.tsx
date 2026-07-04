'use client'

import { createComplaint } from '@/features/complaints/actions/complaint.actions'
import {
  createComplaintSchema,
  type CreateComplaintInput,
} from '@/features/complaints/schemas/complaint.schema'
import { Field, input } from '@/features/checkout/components/ui'
import { Button } from '@/shared/components/ui/Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function ComplaintBookForm() {
  const [successCode, setSuccessCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      docType: 'DNI',
      type: 'RECLAMO',
    },
  })

  const onSubmit = async (data: CreateComplaintInput) => {
    setLoading(true)
    const result = await createComplaint(data)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setSuccessCode(result.data.code)
    reset()
  }

  if (successCode) {
    return (
      <div className="bg-card border border-(--bd) px-6 py-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center">
          <BadgeCheck size={32} className="text-(--gold)" />
        </div>
        <h2 className="font-display font-black uppercase text-[22px] tracking-tight">
          Reclamo registrado
        </h2>
        <p className="text-muted text-[13px] max-w-md">
          Tu reclamo quedó registrado con el código{' '}
          <span className="font-mono text-(--gold)">{successCode}</span>. Te responderemos al
          correo indicado dentro del plazo legal (máximo 30 días calendario).
        </p>
        <Button variant="outline" size="md" onClick={() => setSuccessCode(null)}>
          Registrar otro reclamo
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <section className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
          1. Identificación del consumidor
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" error={errors.fullName?.message} span={2}>
            <input {...register('fullName')} className={input} placeholder="Juan García" />
          </Field>

          <Field label="Tipo de documento" error={errors.docType?.message}>
            <select {...register('docType')} className={input}>
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </Field>

          <Field label="Número de documento" error={errors.docNumber?.message}>
            <input {...register('docNumber')} className={input} placeholder="12345678" />
          </Field>

          <Field label="Domicilio" error={errors.address?.message} span={2}>
            <input
              {...register('address')}
              className={input}
              placeholder="Av. Principal 123, Dpto. 4B"
            />
          </Field>

          <Field label="Teléfono" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" className={input} placeholder="+51 999 999 999" />
          </Field>

          <Field label="Correo electrónico" error={errors.email?.message}>
            <input {...register('email')} type="email" className={input} placeholder="tu@correo.com" />
          </Field>
        </div>
      </section>

      <section className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
          2. Identificación del bien o servicio
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Producto o servicio contratado" error={errors.productDescription?.message} span={2}>
            <input
              {...register('productDescription')}
              className={input}
              placeholder="Ej. Figura de colección LEGO Star Wars 75375"
            />
          </Field>

          <Field label="Monto reclamado (S/, opcional)" error={errors.claimedAmount?.message}>
            <input
              {...register('claimedAmount')}
              type="number"
              min={0}
              step="0.01"
              className={input}
              placeholder="0.00"
            />
          </Field>
        </div>
      </section>

      <section className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
          3. Detalle de la reclamación
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Tipo" error={errors.type?.message}>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input {...register('type')} type="radio" value="RECLAMO" className="accent-(--gold)" />
                Reclamo
                <span className="text-muted text-[11px]">
                  (disconformidad con el producto/servicio)
                </span>
              </label>
              <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input {...register('type')} type="radio" value="QUEJA" className="accent-(--gold)" />
                Queja
                <span className="text-muted text-[11px]">(disconformidad con la atención)</span>
              </label>
            </div>
          </Field>

          <Field label="Detalle" error={errors.detail?.message}>
            <textarea
              {...register('detail')}
              rows={4}
              className={input}
              placeholder="Describe lo ocurrido con el mayor detalle posible..."
            />
          </Field>

          <Field label="Pedido del consumidor" error={errors.request?.message}>
            <textarea
              {...register('request')}
              rows={2}
              className={input}
              placeholder="Ej. Solicito el cambio del producto / la devolución de mi dinero..."
            />
          </Field>
        </div>
      </section>

      <Button variant="accent" size="lg" full type="submit" disabled={loading}>
        <Send size={15} className="mr-2" />
        {loading ? 'Enviando...' : 'Enviar reclamo'}
      </Button>
    </form>
  )
}
