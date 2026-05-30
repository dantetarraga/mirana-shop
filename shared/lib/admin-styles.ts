import React from "react";

// Re-exportar FormField desde su nueva ubicación canónica
export { FormField } from "@/shared/components/ui/FormField";

/**
 * DEPRECATED — Las clases visuales se migraron a globals.css (@layer components).
 * Usar las clases CSS directamente:
 *   adm-panel, adm-panel-table, adm-kpi, adm-th, adm-td,
 *   adm-section-label, adm-page-title, adm-mono, adm-mono-gold,
 *   adm-val, adm-val-gold, adm-row-name, adm-row-sub, adm-input
 *
 * Este objeto se mantiene temporalmente para no romper imports externos.
 */
export const S = {
  panel: { background: "var(--card)", border: "1px solid var(--bd)", padding: "22px 24px", marginBottom: 16 } as React.CSSProperties,
  kpi:   { background: "var(--card)", border: "1px solid var(--bd)", padding: "20px 22px" } as React.CSSProperties,
  th:    { background: "var(--surf)", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--mt)", padding: "13px 16px", textAlign: "left" as const, borderBottom: "1px solid var(--bd)" },
  td:    { padding: "13px 16px", borderBottom: "1px solid var(--bd)", fontSize: 14, verticalAlign: "middle" as const },
  btnA:  { background: "var(--gold)", color: "#000", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" as const, padding: "11px 22px", border: "none", cursor: "pointer" },
  btnG:  { background: "none", border: "1px solid var(--bd)", color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, padding: "11px 22px", cursor: "pointer" },
};

export const ftab = (on: boolean): React.CSSProperties => ({
  background: on ? "var(--gold)" : "var(--card)", border: "1px solid var(--bd)",
  color: on ? "#000" : "var(--mt)", fontFamily: "var(--font-display)", fontSize: 14,
  fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase",
  padding: "9px 18px", cursor: "pointer", transition: ".2s",
  display: "inline-flex", alignItems: "center", gap: 8,
});

/**
 * DEPRECATED — usar clase CSS .adm-input en su lugar.
 */
export const formInp: React.CSSProperties = {
  width: "100%", background: "var(--card)", border: "1px solid var(--bd)",
  color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14,
  padding: "11px 13px", outline: "none",
};
