// ---------------------------------------------------------------------------
// Tipos de dominio del Admin — basados en datos reales de la BD
// Reemplaza gradualmente a admin-mock.types.ts
// ---------------------------------------------------------------------------

import type { OrderListItem } from "@/modules/orders/repositories/order.repo";
import type { ProductListItem } from "@/modules/catalog/repositories/product.repo";
import type { BannerRow } from "@/modules/catalog/repositories/banner.repo";
import type { InventoryRow } from "@/modules/inventory/repositories/inventory.repo";

// Re-exportamos los tipos de repositorio como tipos de dominio admin
export type { OrderListItem as AdminOrder };
export type { ProductListItem as AdminProduct };
export type { BannerRow as AdminBanner };
export type { InventoryRow as AdminInventory };

// ---------------------------------------------------------------------------
// Tipos de usuario admin (de BD real)
// ---------------------------------------------------------------------------

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  createdAt: Date;
  deletedAt: Date | null;
  _count: { orders: number };
};

// ---------------------------------------------------------------------------
// Estadísticas del dashboard
// ---------------------------------------------------------------------------

export type DashboardStats = {
  revenue: { current: number; previous: number };
  orders: { total: number; pending: number; shipped: number; delivered: number; cancelled: number };
  users: { total: number; new: number };
  inventory: { totalUnits: number; totalValue: number; lowStock: number; outOfStock: number };
};
