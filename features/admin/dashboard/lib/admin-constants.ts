import { ORDERS_DATA } from "./admin-data";

export type Module = "dashboard" | "orders" | "products" | "inventory" | "banners" | "users";
export type Order  = typeof ORDERS_DATA[number];

export const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:  { label: "Pendiente",  color: "#ffb84a", bg: "rgba(255,184,74,.12)"  },
  enviado:    { label: "Enviado",    color: "#5f9eff", bg: "rgba(95,158,255,.12)"  },
  entregado:  { label: "Entregado",  color: "#3fcf7f", bg: "rgba(63,207,127,.12)"  },
  cancelado:  { label: "Cancelado",  color: "#ff6644", bg: "rgba(255,102,68,.12)"  },
};

export const USER_STATUS: Record<string, { label: string; color: string }> = {
  vip:    { label: "VIP",    color: "var(--gold)" },
  activo: { label: "Activo", color: "#3fcf7f" },
  nuevo:  { label: "Nuevo",  color: "#5f9eff" },
};

export const BANNER_STATUS: Record<string, { label: string; color: string }> = {
  activo:     { label: "Activo",     color: "#3fcf7f" },
  programado: { label: "Programado", color: "#5f9eff" },
  inactivo:   { label: "Inactivo",   color: "#ff6644" },
};

export const fmt      = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.price * i.qty, 0);
export const fmtDate  = (d: string) => new Date(d + "T00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
