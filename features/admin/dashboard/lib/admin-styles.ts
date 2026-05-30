import React from "react";

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

export const formInp: React.CSSProperties = {
  width: "100%", background: "var(--card)", border: "1px solid var(--bd)",
  color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14,
  padding: "11px 13px", outline: "none",
};

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    React.createElement("div", null,
      React.createElement("label", {
        style: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }
      }, label),
      children
    )
  );
}
