import { ComplaintBookForm } from '@/features/complaints/components/ComplaintBookForm'
import { ANEXO_II_NOTICE } from '@/features/complaints/lib/complaint-sheet'
import { getProviderLegalData } from '@/features/settings/queries/store-settings.queries'
import { BookOpen } from 'lucide-react'
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
    <div className="px-4 sm:px-6 pt-9 pb-16 max-w-180 mx-auto">
      <div className="mb-8 print:hidden">
        <p className="text-[10px] tracking-[3px] uppercase text-accent-ink mb-1">Atención al cliente</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none mb-4 flex items-center gap-3">
          <BookOpen size={30} aria-hidden="true" className="text-accent-ink shrink-0" />
          Libro de Reclamaciones
        </h1>

        {/* Aviso del Libro de Reclamaciones (Anexo II) */}
        <aside
          aria-label="Aviso del Libro de Reclamaciones"
          className="border border-(--gold)/40 bg-(--gold)/5 px-4 py-3 mb-4 text-[13px] leading-relaxed"
        >
          {ANEXO_II_NOTICE}
        </aside>

        <p className="text-muted text-[13px] leading-relaxed">
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni
          es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá
          dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual
          es improrrogable. Al enviar la hoja recibirás una copia en tu correo electrónico.
        </p>
      </div>

      <ComplaintBookForm provider={provider} todayIso={todayIso} />
    </div>
  )
}
