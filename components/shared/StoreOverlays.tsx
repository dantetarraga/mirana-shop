"use client";

import { CartDrawer } from "./CartDrawer";
import { ProductModal } from "./ProductModal";
import { AuthModal } from "./AuthModal";

export function StoreOverlays() {
  return (
    <>
      <CartDrawer />
      <ProductModal />
      <AuthModal />
    </>
  );
}
