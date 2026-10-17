import { getDiscount } from '@/features/products/lib/product-badge'
import { cn } from '@/shared/lib/utils'

interface ProductPriceProps {
  price: number
  salePrice: number | null
  /** `lg` = ficha de producto, `md` = modal de vista rápida. */
  size?: 'lg' | 'md'
  className?: string
}

/**
 * Precio con oferta — mismo formato en ficha y modal: precio vigente, precio
 * anterior tachado (<del> + texto para lectores), % de descuento y
 * "Ahorras S/ X". Antes la ficha no mostraba ni el % ni el ahorro que la card
 * sí anunciaba en su badge, y el mismo producto parecía tener otra oferta.
 * Sin hooks: sirve en RSC y en cliente.
 */
export function ProductPrice({ price, salePrice, size = 'lg', className }: ProductPriceProps) {
  const { hasDiscount, percent, savings } = getDiscount({ price, salePrice })
  const current = hasDiscount ? (salePrice as number) : price
  const lg = size === 'lg'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap">
        <div
          className={cn(
            'font-display font-black text-accent-ink leading-none',
            lg ? 'text-[40px] sm:text-[56px]' : 'text-[38px] sm:text-[52px]',
          )}
        >
          {hasDiscount && <span className="sr-only">Precio de oferta: </span>}
          S/ {current.toFixed(2)}
        </div>
        {hasDiscount && (
          <del
            className={cn(
              'font-display font-bold text-muted leading-none',
              lg ? 'text-[22px] sm:text-[28px]' : 'text-[20px] sm:text-[26px]',
            )}
          >
            <span className="sr-only">Precio anterior: </span>S/ {price.toFixed(2)}
          </del>
        )}
      </div>
      {hasDiscount && (
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="bg-danger text-white text-[12px] font-extrabold tracking-[1px] uppercase px-2 py-0.5">
            -{percent}%
          </span>
          <span className="text-[14px] font-semibold text-danger">
            Ahorras S/ {savings.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
