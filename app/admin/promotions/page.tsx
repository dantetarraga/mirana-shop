import { NewPromotionButton } from '@/features/promotions/components/NewPromotionButton'
import { PromotionCard } from '@/features/promotions/components/PromotionCard'
import { PromotionCrudProvider } from '@/features/promotions/components/PromotionCrudProvider'
import { getPromotions } from '@/features/promotions/queries/promotion.queries'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'

export const metadata = { title: 'Promociones | Mirana Admin' }

export default async function PromotionsPage() {
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
          <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
            <span className="text-[48px]">🏷️</span>
            <p className="text-[14px]">No hay promociones creadas todavía.</p>
            <NewPromotionButton>Crear primera promoción</NewPromotionButton>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        )}
      </div>
    </PromotionCrudProvider>
  )
}
