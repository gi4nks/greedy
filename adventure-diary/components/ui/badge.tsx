import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default: "badge-neutral",
        secondary: "badge-secondary",
        destructive: "badge-error",
        outline: "badge-outline",
        primary: "badge-primary",
        error: "badge-error",
        ghost: "badge-ghost",
        info: "badge-info",
        success: "badge-success",
        warning: "badge-warning",
        accent: "badge-accent",
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