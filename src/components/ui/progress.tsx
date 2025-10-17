"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLProgressElement,
  React.ProgressHTMLAttributes<HTMLProgressElement> & {
    value?: number;
  }
>(({ className, value, ...props }, ref) => (
  <progress
    ref={ref}
    className={cn("progress progress-primary w-full", className)}
    value={value}
    {...props}
  />
));
Progress.displayName = "Progress";

export { Progress };
