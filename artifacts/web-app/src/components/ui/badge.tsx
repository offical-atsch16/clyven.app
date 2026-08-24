import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-2.5 py-0.5 text-xs font-medium text-zinc-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-white/[0.06] text-zinc-100 shadow-xs",
        secondary:
          "border-white/[0.06] bg-zinc-900/60 text-zinc-300",
        destructive:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 shadow-xs",
        outline: "text-zinc-300 border-white/10 hover:border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
