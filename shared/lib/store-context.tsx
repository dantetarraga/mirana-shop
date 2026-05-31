"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CatalogProduct } from "@/shared/types/catalog.types";

export type UserRole = "admin" | "customer";
export type CartItem = { product: CatalogProduct; qty: number };
export type User = { name: string; email: string; role: UserRole };

type StoreContextType = {
  cart: CartItem[];
  addToCart: (product: CatalogProduct, qty?: number) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  user: User | null;
  authOpen: boolean;
  authMode: "login" | "register";
  openAuth: (mode: "login" | "register") => void;
  closeAuth: () => void;
  authenticate: (user: Omit<User, "role">) => void;
  logout: () => void;
  activeProduct: CatalogProduct | null;
  openProductModal: (product: CatalogProduct) => void;
  closeProductModal: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

const ADMIN_EMAILS = ["admin@mirana.com", "admin"];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeProduct, setActiveProduct] = useState<CatalogProduct | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("m-cart");
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedUser = localStorage.getItem("m-user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("m-cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("m-user", JSON.stringify(user));
  }, [user, hydrated]);

  const addToCart = (product: CatalogProduct, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i.product.id === product.id);
      if (ex)
        return c.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      return [...c, { product, qty }];
    });
  };

  const updateQty = (id: string, delta: number) =>
    setCart((c) =>
      c.map((i) =>
        i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    );

  const removeItem = (id: string) =>
    setCart((c) => c.filter((i) => i.product.id !== id));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);

  const authenticate = (u: Omit<User, "role">) => {
    const isAdmin = ADMIN_EMAILS.some((e) => u.email.toLowerCase().includes(e));
    setUser({ ...u, role: isAdmin ? "admin" : "customer" });
    setAuthOpen(false);
  };

  const logout = () => setUser(null);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeItem,
        cartCount,
        cartOpen,
        setCartOpen,
        user,
        authOpen,
        authMode,
        openAuth,
        closeAuth,
        authenticate,
        logout,
        activeProduct,
        openProductModal: setActiveProduct,
        closeProductModal: () => setActiveProduct(null),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
