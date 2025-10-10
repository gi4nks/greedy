import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton bg-base-300", className)}
      {...props}
    />
  )
}

export { Skeleton }