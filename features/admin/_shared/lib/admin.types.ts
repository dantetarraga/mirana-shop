// ── Tipos de dominio del Admin ────────────────────────────────────────────────
// Sustituye los typeof DATA[number] dispersos por interfaces explícitas.

export type OrderStatus = "pendiente" | "enviado" | "entregado" | "cancelado";
export type UserStatus  = "vip" | "activo" | "nuevo";
export type BannerStatus = "activo" | "programado" | "inactivo";
export type BannerPosition = "Hero principal" | "Banda CTA" | "Marquee superior";

export interface OrderItem {
  name:  string;
  qty:   number;
  price: number;
}

export interface Order {
  id:       string;
  customer: string;
  email:    string;
  date:     string;
  status:   OrderStatus;
  payment:  string;
  items:    OrderItem[];
  city:     string;
}

export interface User {
  id:     number;
  name:   string;
  email:  string;
  joined: string;
  orders: number;
  spent:  number;
  status: UserStatus;
}

export interface Banner {
  id:       number;
  title:    string;
  subtitle: string;
  cta:      string;
  position: string;
  status:   BannerStatus;
  clicks:   number;
}
