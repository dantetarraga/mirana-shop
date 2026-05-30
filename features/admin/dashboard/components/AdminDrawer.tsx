import React from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export function AdminDrawer({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "var(--surf)", borderLeft: "1px solid var(--bd)", height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "var(--surf)", zIndex: 5 }}>
          <div>
            {sub && <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>{sub}</div>}
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, letterSpacing: "-.5px" }}>{title}</div>
          </div>
          <Button variant="icon" size="md" onClick={onClose}><X size={16} /></Button>
        </div>
        <div style={{ padding: "24px 28px 40px", display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
      </div>
    </div>
  );
}
