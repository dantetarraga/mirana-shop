"use client";
import { create } from "zustand";
import { PRODUCTS, type Product } from "@/shared/data/products";
import { ORDERS_DATA } from "@/features/admin/dashboard/lib/admin-data";

type Order = typeof ORDERS_DATA[number];

interface AdminState {
  products: Product[];
  orders: Order[];
  saveProduct: (p: Product) => void;
  deleteProduct: (id: number) => void;
  setOrderStatus: (id: string, status: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  products: PRODUCTS,
  orders: ORDERS_DATA,
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
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
}));
