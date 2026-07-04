import { getLegalPage } from '@/features/legal/queries/legal.queries'
import { formatDate } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Vista pública de una página legal. El contenido HTML proviene del editor
// del admin (/admin/legal), autoría restringida a administradores.
// ---------------------------------------------------------------------------

interface LegalPageViewProps {
  slug: string
  fallbackTitle: string
}

export async function LegalPageView({ slug, fallbackTitle }: LegalPageViewProps) {
  const page = await getLegalPage(slug)

  return (
    <section className="shell pb-20 pt-[calc(var(--nh)+36px)]">
      <div className="max-w-175 mx-auto">
        <div className="text-[10px] font-bold tracking-[3px] uppercase mb-1.5 text-(--gold)">
          Legal
        </div>
        <h1 className="font-display font-black uppercase tracking-[-1px] m-0 mb-2 leading-[0.95] text-[clamp(30px,4vw,48px)]">
          {page?.title || fallbackTitle}
        </h1>
        {page?.updatedAt && (
          <div className="text-[12px] text-muted mb-8">
            Última actualización: {formatDate(page.updatedAt)}
          </div>
        )}

        {page?.content ? (
          <div className="legal-prose" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <p className="text-muted text-[14px] mt-6">
            Contenido en preparación. Vuelve a revisar pronto.
          </p>
        )}
      </div>
    </section>
  )
}
