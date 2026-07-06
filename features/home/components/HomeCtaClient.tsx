'use client'

import { saveHomeCta } from '@/features/home/actions/home-cta.actions'
import type { HomeCtaData } from '@/features/home/queries/home-cta.queries'
import { ImageUploadField } from '@/shared/components/admin/ImageUploadField'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useServerAction } from '@/shared/hooks/admin'
import { ArrowRight, ExternalLink, Save } from 'lucide-react'
import { useState } from 'react'

interface HomeCtaClientProps {
  initial: HomeCtaData
}

export function HomeCtaClient({ initial }: HomeCtaClientProps) {
  const [form, setForm] = useState<HomeCtaData>(initial)
  const { isPending, run } = useServerAction()

  const set = <K extends keyof HomeCtaData>(key: K, value: HomeCtaData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const save = () =>
    run(() => saveHomeCta(form), {
      successMsg: 'CTA guardado',
      refresh: true,
    })

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader label="Contenido" title="CTA de Inicio" align="center" />

      <div className="max-w-175 flex flex-col gap-4">
        {/* Vista previa */}
        <div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted mb-2">
            Vista previa
          </div>
          <div
            className={`relative overflow-hidden px-5 sm:px-8 py-6 sm:py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] ${
              form.imageUrl ? 'bg-cover bg-center' : 'bg-(--gold)'
            }`}
            style={form.imageUrl ? { backgroundImage: `url(${form.imageUrl})` } : undefined}
          >
            {form.imageUrl && <div className="absolute inset-0 bg-black/55" aria-hidden />}
            <div className="relative z-1">
              <div
                className={`font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(22px,3vw,38px)] whitespace-pre-line ${
                  form.imageUrl ? 'text-white' : 'text-black'
                }`}
              >
                {form.title || 'Título'}
              </div>
              {form.subtitle && (
                <p
                  className={`text-[13px] mt-2 ${form.imageUrl ? 'text-white/70' : 'text-black/55'}`}
                >
                  {form.subtitle}
                </p>
              )}
            </div>
            {form.ctaLabel && (
              <span className="relative z-1 shrink-0 inline-flex items-center gap-1.5 bg-black text-(--gold) font-display font-bold uppercase text-[13px] tracking-[1px] px-5 py-3 whitespace-nowrap">
                {form.ctaLabel} <ArrowRight size={13} strokeWidth={3} />
              </span>
            )}
          </div>
        </div>

        <FormField label="Título (Enter para salto de línea)">
          <textarea
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            rows={2}
            className="adm-input resize-none"
            placeholder={'Ediciones\nLimitadas'}
          />
        </FormField>

        <FormField label="Subtítulo">
          <input
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            className="adm-input"
            placeholder="Piezas por tiempo limitado — no te quedes sin las tuyas"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Texto del botón">
            <input
              value={form.ctaLabel}
              onChange={(e) => set('ctaLabel', e.target.value)}
              className="adm-input"
              placeholder="Explorar ahora"
            />
          </FormField>
          <FormField label="Enlace del botón">
            <input
              value={form.ctaHref}
              onChange={(e) => set('ctaHref', e.target.value)}
              className="adm-input"
              placeholder="/catalogo?oferta=1"
            />
          </FormField>
        </div>

        <FormField label="Imagen de fondo (opcional — sin imagen se usa el fondo de color)">
          <ImageUploadField
            value={form.imageUrl}
            onChange={(url) => set('imageUrl', url)}
            folder="cta"
            placeholder="https://…/banner.jpg"
          />
        </FormField>

        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-muted select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="accent-(--gold)"
          />
          Mostrar la franja en el inicio
        </label>

        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          <Button
            variant="accent"
            size="md"
            onClick={save}
            disabled={isPending || !form.title.trim()}
          >
            <Save size={15} className="mr-1.5" />
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-text no-underline transition-colors"
          >
            <ExternalLink size={13} /> Ver inicio
          </a>
        </div>
      </div>
    </div>
  )
}
