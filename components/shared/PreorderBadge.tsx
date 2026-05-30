import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PreorderBadgeProps {
  estimatedArrival: Date;
  size?: "sm" | "md";
}

export function PreorderBadge({ estimatedArrival, size = "sm" }: PreorderBadgeProps) {
  return (
    <span className="badge-preorder">
      <Clock
        size={size === "sm" ? 10 : 12}
        className="shrink-0"
        aria-hidden
      />
      <span>PREVENTA · {formatDate(estimatedArrival, { month: "short", year: "numeric" })}</span>
    </span>
  );
}
