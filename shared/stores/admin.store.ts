"use client";
/**
 * @deprecated Este store mock ya no se usa en las páginas admin.
 * Las páginas ahora usan Server Components + Server Actions con datos reales de la BD.
 * Se mantiene para no romper imports residuales durante la migración.
 */
import { create } from "zustand";
import { PRODUCTS, type Product } from "@/features/products/data/products";
import { ORDERS_DATA, BANNERS_DATA } from "@/shared/lib/admin-data";
import type { Order, Banner } from "@/shared/types/admin-mock.types";

interface AdminState {
  products:        Product[];
  orders:          Order[];
  banners:         Banner[];
  saveProduct:     (p: Product) => void;
  deleteProduct:   (id: number) => void;
  importProducts:  (items: Omit<Product, "id" | "badge" | "rating" | "reviews" | "isNew">[]) => void;
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

  importProducts: (items) =>
    set((s) => {
      const nextId = Math.max(0, ...s.products.map((p) => p.id)) + 1;
      const incoming = items.map((item, i) => ({
        ...item,
        id:      nextId + i,
        badge:   null,
        rating:  0,
        reviews: 0,
        isNew:   true,
      }));
      // SKUs duplicados se actualizan en lugar de duplicarse
      const skuMap = new Map(s.products.map((p) => [p.sku, p]));
      incoming.forEach((p) => skuMap.set(p.sku, { ...skuMap.get(p.sku), ...p } as Product));
      return { products: Array.from(skuMap.values()) };
    }),

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
