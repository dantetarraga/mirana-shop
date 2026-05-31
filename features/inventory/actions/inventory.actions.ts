"use server";

import { revalidatePath } from "next/cache";
import { inventoryRepo, OptimisticLockError } from "@/modules/inventory/repositories/inventory.repo";
import { adjustStockSchema } from "@/shared/lib/schemas";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// adjustStock
// Ajusta el stock de un producto con optimistic locking.
// Reintenta automáticamente hasta 3 veces en caso de conflicto concurrente.
// ---------------------------------------------------------------------------

export async function adjustStock(rawInput: unknown): Promise<ActionResult<{ newStock: number }>> {
  const parsed = adjustStockSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const { productId, newStock, reason } = parsed.data;

  const MAX_RETRIES = 3;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      const result = await inventoryRepo.adjustStock({
        productId,
        delta: 0,
        newStock,
        type: "ADJUSTMENT",
        reason: reason ?? "Ajuste manual desde admin",
      });

      revalidatePath("/admin/inventory");
      revalidatePath("/admin/dashboard");
      revalidatePath("/catalogo");
      revalidatePath("/");

      return { success: true, data: { newStock: result.availableStock } };
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        attempts++;
        if (attempts >= MAX_RETRIES) {
          return {
            success: false,
            error: "El inventario fue modificado concurrentemente. Intenta de nuevo.",
          };
        }
        // Pequeña espera exponencial antes de reintentar
        await new Promise((r) => setTimeout(r, 50 * attempts));
        continue;
      }

      const message = err instanceof Error ? err.message : "Error al ajustar stock";
      return { success: false, error: message };
    }
  }

  return { success: false, error: "No se pudo completar el ajuste de inventario" };
}
