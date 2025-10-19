import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-primary",
      destructive: "btn-error",
      outline: "btn-outline",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      link: "btn-link",
      info: "btn-info",
      primary: "btn-primary",
      accent: "btn-accent",
      success: "btn-success",
      warning: "btn-warning",
      neutral: "btn-neutral",
      error: "btn-error",
    },
    size: {
      default: "",
      sm: "btn-sm",
      lg: "btn-lg",
      xs: "btn-xs",
      icon: "btn-square",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      const mergedClassName = cn(
        buttonVariants({ variant, size }),
        className,
        child.props.className,
      );

      type ChildProps =
        typeof child extends React.ReactElement<infer P> ? P : never;

      const forwardedProps = {
        ...props,
        className: mergedClassName,
      } as Partial<ChildProps>;

      return React.cloneElement(child, forwardedProps);
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
