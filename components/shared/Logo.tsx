import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const fontSize = size === "sm" ? 20 : size === "lg" ? 36 : 26;
  return (
    <Link
      href="/"
      style={{
        fontFamily: "var(--font-display)", fontWeight: 900,
        fontSize, letterSpacing: 5, color: "var(--text)",
        textDecoration: "none", textTransform: "uppercase" as const,
        transition: "opacity .2s",
      }}
      className="hover:opacity-80"
    >
      MIRA<span style={{ color: "var(--gold)" }}>NA</span>
    </Link>
  );
}
