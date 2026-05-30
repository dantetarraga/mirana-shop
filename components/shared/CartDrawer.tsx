"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store-context";
import { CAT_STRIPE } from "@/shared/data/products";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeItem } = useStore();
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setCartOpen(false); };
    if (cartOpen) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <>
      <div onClick={() => setCartOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 401,
        width: 420, background: "var(--surf)",
        borderLeft: "1px solid var(--bd)",
        display: "flex", flexDirection: "column",
        animation: "slideRight .28s cubic-bezier(.4,0,.2,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px", borderBottom: "1px solid var(--bd)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
            Carrito <span style={{ color: "var(--gold)" }}>({cart.length})</span>
          </div>
          <Button variant="icon" size="md" onClick={() => setCartOpen(false)}>×</Button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--mt)" }}>
              <div style={{ fontSize: 52, marginBottom: 16, opacity: .25 }}>🛒</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>Carrito vacío</div>
              <div style={{ fontSize: 13 }}>Agrega productos para continuar</div>
            </div>
          ) : cart.map((item) => (
            <div key={item.product.id} style={{
              display: "flex", gap: 14, alignItems: "center",
              paddingBottom: 14, borderBottom: "1px solid var(--bd)",
            }}>
              <div className={CAT_STRIPE[item.product.cat]} style={{ width: 70, height: 70, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.product.name}
                </div>
                <div style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginTop: 1 }}>
                  ${item.product.price.toFixed(2)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <Button variant="icon" size="sm" onClick={() => updateQty(item.product.id, -1)}>−</Button>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                  <Button variant="icon" size="sm" onClick={() => updateQty(item.product.id, 1)}>+</Button>
                </div>
              </div>
              <Button variant="icon" size="sm" destructive onClick={() => removeItem(item.product.id)} style={{ alignSelf: "flex-start" }}>×</Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "24px 28px", borderTop: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--mt)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 900, color: "var(--gold)" }}>${total.toFixed(2)}</span>
            </div>
            <Button variant="accent" size="lg" full>
              Finalizar compra →
            </Button>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--mt)" }}>Envío gratis en pedidos +$75</div>
          </div>
        )}
      </div>
    </>
  );
}
