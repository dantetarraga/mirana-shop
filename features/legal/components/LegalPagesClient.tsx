'use client'

import { saveLegalPage } from '@/features/legal/actions/legal.actions'
import { RichTextEditor } from '@/features/legal/components/RichTextEditor'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useServerAction } from '@/shared/hooks/admin'
import { cn } from '@/shared/lib/utils'
import { ExternalLink, Save } from 'lucide-react'
import { useState } from 'react'

export interface LegalDoc {
  slug: string
  title: string
  content: string
}

interface LegalPagesClientProps {
  terms: LegalDoc
  privacy: LegalDoc
}

// ---------------------------------------------------------------------------
// Panel por documento: título + editor + guardar. Ambos paneles permanecen
// montados (se ocultan con CSS) para no perder cambios al cambiar de tab.
// ---------------------------------------------------------------------------

function DocPanel({ doc, hidden }: { doc: LegalDoc; hidden: boolean }) {
  const [title, setTitle] = useState(doc.title)
  const [content, setContent] = useState(doc.content)
  const { isPending, run } = useServerAction()

  const save = () =>
    run(() => saveLegalPage({ slug: doc.slug, title, content }), {
      successMsg: 'Contenido guardado',
      refresh: true,
    })

  return (
    <div className={cn('flex flex-col gap-4', hidden && 'hidden')}>
      <FormField label="Título de la página">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="adm-input"
          placeholder="Título"
        />
      </FormField>

      <RichTextEditor content={doc.content} onChange={setContent} />

      <div className="flex items-center gap-2.5">
        <Button variant="accent" size="md" onClick={save} disabled={isPending || !title.trim()}>
          <Save size={15} className="mr-1.5" />
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <a
          href={`/${doc.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-text no-underline transition-colors"
        >
          <ExternalLink size={13} /> Ver página publicada
        </a>
      </div>
    </div>
  )
}

export function LegalPagesClient({ terms, privacy }: LegalPagesClientProps) {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms')

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader label="Contenido" title="Páginas legales" align="center" />

      <div className="max-w-200">
        <div className="flex border border-(--bd) mb-6">
          {(
            [
              ['terms', 'Términos y Condiciones'],
              ['privacy', 'Política de Privacidad'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant="tab"
              size="md"
              active={tab === key}
              onClick={() => setTab(key)}
              className="flex-1"
            >
              {label}
            </Button>
          ))}
        </div>

        <DocPanel doc={terms} hidden={tab !== 'terms'} />
        <DocPanel doc={privacy} hidden={tab !== 'privacy'} />
      </div>
    </div>
  )
}
