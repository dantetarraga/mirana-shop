export function StockBadge({ s }: { s: number }) {
  const [color, border, text] = s === 0
    ? ["#ff6644", "rgba(255,102,68,.3)", "● Agotado"]
    : s <= 8
    ? ["#ffb84a", "rgba(255,184,74,.3)", `● ${s} · Bajo`]
    : ["#3fcf7f", "rgba(63,207,127,.3)", `● ${s}`];
  return (
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", border: `1px solid ${border}`, color }}>
      {text}
    </span>
  );
}
