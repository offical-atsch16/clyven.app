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

  if (normTier === "business") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold tracking-wide rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/10",
          sizes[size],
          className
        )}
      >
        <Crown className={cn("shrink-0 text-amber-400", iconSizes[size])} />
        <span>BUSINESS</span>
      </span>
    );
  }

  if (normTier === "plus" || normTier === "premium" || normTier === "clyven_plus") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold tracking-wide rounded-full border bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-sm shadow-violet-500/20 animate-pulse-slow",
          sizes[size],
          className
        )}
      >
        <Zap className={cn("shrink-0 text-violet-400 fill-violet-400/20", iconSizes[size])} />
        <span>PLUS</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border bg-white/[0.05] text-white/40 border-white/10",
        sizes[size],
        className
      )}
    >
      <span>FREE</span>
    </span>
  );
}
