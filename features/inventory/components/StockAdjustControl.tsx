'use client'

import { adjustStock } from '@/features/admin/inventory/actions/inventory.actions'
import { Button } from '@/shared/components/ui/Button'
import { useServerAction } from '@/shared/hooks/admin'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  productId: string
  productName: string
  stock: number
}

export function StockAdjustControl({ productId, productName, stock }: Props) {
  const { isPending, run } = useServerAction()

  const adjust = (next: number) => {
    if (next < 0) return
    run(() => adjustStock({ productId, newStock: next }), {
      onSuccess: (data) => {
        toast.success(`Stock de "${productName}" → ${data.newStock}`)
      },
      refresh: true,
    })
  }

  return (
    <div className="flex gap-1.5 items-center">
      <Button
        variant="icon"
        size="sm"
        onClick={() => adjust(Math.max(0, stock - 1))}
        disabled={isPending}
      >
        <Minus size={14} />
      </Button>

      <input
        key={stock}
        type="number"
        defaultValue={stock}
        min="0"
        onBlur={(e) => {
          const next = Math.max(0, parseInt(e.target.value) || 0)
          if (next !== stock) adjust(next)
        }}
        className="w-14.5 text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-(--bd) text-text disabled:opacity-50"
        disabled={isPending}
      />

      <Button variant="icon" size="sm" onClick={() => adjust(stock + 1)} disabled={isPending}>
        <Plus size={14} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => adjust(stock + 50)}
        className="ml-2"
        disabled={isPending}
      >
        +50
      </Button>
    </div>
  )
}
