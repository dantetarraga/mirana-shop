import { NewPromotionButton } from '@/features/promotions/components/NewPromotionButton'
import { PromotionCard } from '@/features/promotions/components/PromotionCard'
import { PromotionCrudProvider } from '@/features/promotions/components/PromotionCrudProvider'
import { getPromotions } from '@/features/promotions/queries/promotion.queries'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { verifyAdmin } from '@/shared/lib/require-admin'
import { Tag } from 'lucide-react'
import { EmptyState } from '@/shared/components/ui/EmptyState'

export const metadata = { title: 'Promociones | Mirana Admin' }

export default async function PromotionsPage() {
  await verifyAdmin()
  const promotions = await getPromotions()
  const activeCount = promotions.filter((p) => p.active).length

  return (
    <PromotionCrudProvider>
      <div className="px-8 pt-7 pb-12">
        <PanelHeader
          label="Marketing"
          title={`${activeCount} promoción${activeCount !== 1 ? 'es' : ''} activa${activeCount !== 1 ? 's' : ''}`}
          align="center"
          side={<NewPromotionButton />}
        />

        {promotions.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Aún no hay promociones"
            description="Una promoción define el descuento; luego puedes mostrarla en la barra superior o atarla a un cupón."
            className="border border-dashed border-(--bd)"
            action={<NewPromotionButton>Crear primera promoción</NewPromotionButton>}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        )}
      </div>
    </PromotionCrudProvider>
  )
}
