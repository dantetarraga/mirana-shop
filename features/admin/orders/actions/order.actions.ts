"use server";

import { revalidatePath } from "next/cache";
import { orderRepo } from "@/modules/orders/repositories/order.repo";
import { updateOrderStatusSchema } from "@/shared/lib/schemas";
import type { OrderStatus } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

export async function updateOrderStatus(rawInput: unknown): Promise<ActionResult<{ id: string; status: string }>> {
  const parsed = updateOrderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const { orderId, status } = parsed.data;

  try {
    const options: { cancelledAt?: Date; paidAt?: Date } = {};

    if (status === "CANCELLED") {
      options.cancelledAt = new Date();
    } else if (status === "PAID") {
      options.paidAt = new Date();
    }

    const updated = await orderRepo.updateStatus(orderId, status as OrderStatus, options);

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true, data: { id: updated.id, status: updated.status } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar estado del pedido";
    return { success: false, error: message };
  }
}
