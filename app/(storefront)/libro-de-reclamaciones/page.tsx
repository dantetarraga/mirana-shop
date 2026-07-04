import { ComplaintBookForm } from '@/features/complaints/components/ComplaintBookForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones',
  description: 'Registra tu reclamo o queja conforme al Libro de Reclamaciones Virtual.',
}

export default function ComplaintBookPage() {
  return (
    <div className="px-4 sm:px-6 pt-[calc(var(--nh)+36px)] pb-16 max-w-180 mx-auto">
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Atención al cliente</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none mb-3">
          Libro de Reclamaciones
        </h1>
        <p className="text-muted text-[13px] leading-relaxed">
          Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este
          establecimiento cuenta con un Libro de Reclamaciones a tu disposición. La formulación de
          un reclamo no impide acudir a otras vías de solución de controversias ni es requisito
          previo para interponer una denuncia ante el INDECOPI. Te responderemos en un plazo no
          mayor a 30 días calendario.
        </p>
      </div>

      <ComplaintBookForm />
    </div>
  )
}
