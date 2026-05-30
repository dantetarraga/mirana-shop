import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "text-[20px]",
  md: "text-[26px]",
  lg: "text-[36px]",
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`font-display font-black ${SIZE_CLASS[size]} tracking-[5px] text-text no-underline uppercase transition-opacity duration-200 hover:opacity-80`}
    >
      MIRA<span className="text-[var(--gold)]">NA</span>
    </Link>
  );
}
