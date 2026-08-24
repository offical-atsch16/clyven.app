import { Crown, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { PlanTier } from "../lib/billing";

interface PlanBadgeProps {
  tier?: PlanTier | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFree?: boolean;
}

export function PlanBadge({ tier = "free", size = "md", className, showFree = false }: PlanBadgeProps) {
  const normTier = String(tier).toLowerCase();

  if (normTier === "free" && !showFree) {
    return null;
  }

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  if (
    normTier === "plus" ||
    normTier === "premium" ||
    normTier === "clyven_plus" ||
    normTier === "business" ||
    normTier === "clyven_business"
  ) {
    return (
      <span
        className={cn(
          "status-pill font-bold tracking-wide border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/10 backdrop-blur-md",
          sizes[size],
          className
        )}
      >
        <span className="glow-dot-amber shrink-0" />
        <Zap className={cn("shrink-0 text-amber-400 fill-amber-400/20", iconSizes[size])} />
        <span>CLYVEN PLUS</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "status-pill font-medium border-white/10 bg-white/[0.03] text-zinc-400 backdrop-blur-md",
        sizes[size],
        className
      )}
    >
      <span className="glow-dot-blue shrink-0" />
      <span>FREE</span>
    </span>
  );
}
