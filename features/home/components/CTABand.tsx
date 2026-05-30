import { Button } from "@/components/ui/Button";

export function CTABand() {
  return (
    <div style={{
      margin: "0 48px 80px",
      background: "var(--gold)", padding: "48px 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
      clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
    }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,54px)", fontWeight: 900, textTransform: "uppercase", color: "#000", lineHeight: .95, letterSpacing: -1 }}>
          Ediciones<br />Limitadas
        </h2>
        <p style={{ color: "rgba(0,0,0,.55)", fontSize: 14, marginTop: 8 }}>Piezas por tiempo limitado — no te quedes sin las tuyas</p>
      </div>
      <Button variant="dark" size="lg" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        Explorar ahora →
      </Button>
    </div>
  );
}
