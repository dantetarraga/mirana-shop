import { ComplaintBookForm } from '@/features/complaints/components/ComplaintBookForm'
import { ANEXO_II_NOTICE } from '@/features/complaints/lib/complaint-sheet'
import { getProviderLegalData } from '@/features/settings/queries/store-settings.queries'
import { BookOpen, ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones',
  description: 'Registra tu reclamo o queja conforme al Libro de Reclamaciones Virtual.',
}

// Libro de Reclamaciones Virtual — Ley 29571 (Código de Protección y Defensa
// del Consumidor) y su Reglamento, D.S. 011-2011-PCM, modificado por los
// D.S. 006-2014-PCM y 101-2022-PCM. Las hojas se conservan al menos 2 años
// (ver modelo Complaint): nunca pasan por la papelera ni por purgas.

export default async function ComplaintBookPage() {
  // La fecha de la hoja es la del momento de la visita, no la del build.
  await connection()
  const provider = await getProviderLegalData()
  const todayIso = new Date().toISOString()

  return (
    <div className="px-4 sm:px-6 pt-8 pb-16 max-w-190 mx-auto">
      <div className="mb-5 print:hidden">
        <p className="text-[12px] text-accent-ink mb-1.5">Atención al cliente</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none mb-4 flex items-center gap-3">
          <BookOpen size={30} aria-hidden="true" className="text-accent-ink shrink-0" />
          Libro de Reclamaciones
        </h1>

        {/* Aviso del Libro de Reclamaciones (Anexo II): siempre visible */}
        <aside
          aria-label="Aviso del Libro de Reclamaciones"
          className="border border-(--gold)/40 bg-(--gold)/5 px-4 py-3 mb-3 text-[13px] leading-relaxed"
        >
          {ANEXO_II_NOTICE}
        </aside>

        {/* El resto del texto legal se pliega para que el formulario quede a la
            vista. El plazo de 15 días hábiles se repite junto a las declaraciones. */}
        <details className="group border border-(--bd) text-[13px]">
          <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-3 px-4 min-h-11 font-semibold [&::-webkit-details-marker]:hidden">
            Información legal
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="px-4 pb-3.5 text-muted leading-relaxed">
            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni
            es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá
            dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual
            es improrrogable. Al enviar la hoja recibirás una copia en tu correo electrónico.
          </p>
        </details>
      </div>

      <ComplaintBookForm provider={provider} todayIso={todayIso} />
    </div>
  )
}
