"use client";
import { create } from "zustand";
import { PRODUCTS, type Product } from "@/shared/data/products";
import { ORDERS_DATA, BANNERS_DATA } from "@/features/admin/dashboard/lib/admin-data";
import type { Order, Banner } from "@/features/admin/_shared/lib/admin.types";

interface AdminState {
  products:        Product[];
  orders:          Order[];
  banners:         Banner[];
  saveProduct:     (p: Product) => void;
  deleteProduct:   (id: number) => void;
  setOrderStatus:  (id: string, status: string) => void;
  saveBanner:      (b: Banner) => void;
  toggleBanner:    (id: number) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  products: PRODUCTS,
  orders:   ORDERS_DATA as Order[],
  banners:  BANNERS_DATA as Banner[],

  saveProduct: (p) =>
    set((s) => ({
      products: s.products.some((x) => x.id === p.id)
        ? s.products.map((x) => (x.id === p.id ? { ...x, ...p } : x))
        : [...s.products, p],
    })),

  deleteProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  setOrderStatus: (id, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o)),
    })),

  saveBanner: (b) =>
    set((s) => ({
      banners: b.id
        ? s.banners.map((x) => (x.id === b.id ? b : x))
        : [...s.banners, { ...b, id: Math.max(0, ...s.banners.map((x) => x.id)) + 1 }],
    })),

  toggleBanner: (id) =>
    set((s) => ({
      banners: s.banners.map((b) =>
        b.id === id ? { ...b, status: b.status === "activo" ? "inactivo" : "activo" } : b
      ),
    })),
}));
