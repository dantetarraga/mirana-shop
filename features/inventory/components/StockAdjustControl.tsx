"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { adjustStock } from "@/features/inventory/actions/inventory.actions";

interface Props {
  productId:   string;
  productName: string;
  stock:       number;
}

export function StockAdjustControl({ productId, productName, stock }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const adjust = (next: number) => {
    if (next < 0) return;
    startTransition(async () => {
      const result = await adjustStock({ productId, newStock: next });
      if (result.success) {
        toast.success(`Stock de "${productName}" → ${result.data.newStock}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex gap-1.5 items-center">
      <Button
        variant="icon" size="sm"
        onClick={() => adjust(Math.max(0, stock - 1))}
        disabled={isPending}
      >
        <Minus size={14} />
      </Button>

      {/*
        key={stock} remonta el input cuando el servidor devuelve el nuevo valor,
        evitando que el campo quede desincronizado tras router.refresh().
        onBlur en lugar de onChange: evita llamadas al servidor en cada tecla.
      */}
      <input
        key={stock}
        type="number"
        defaultValue={stock}
        min="0"
        onBlur={(e) => {
          const next = Math.max(0, parseInt(e.target.value) || 0);
          if (next !== stock) adjust(next);
        }}
        className="w-14.5 text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-(--bd) text-text disabled:opacity-50"
        disabled={isPending}
      />

      <Button
        variant="icon" size="sm"
        onClick={() => adjust(stock + 1)}
        disabled={isPending}
      >
        <Plus size={14} />
      </Button>

      <Button
        variant="ghost" size="sm"
        onClick={() => adjust(stock + 50)}
        className="ml-2"
        disabled={isPending}
      >
        +50
      </Button>
    </div>
  );
}
