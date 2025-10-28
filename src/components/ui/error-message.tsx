"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  /** The error message to display */
  message?: string | null;
  /** The variant determines the styling and layout */
  variant?: "field" | "form" | "alert" | "inline";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Whether the error can be dismissed */
  dismissible?: boolean;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * A consistent error message component for displaying validation and server errors.
 * Supports multiple variants for different contexts (field errors, form errors, alerts, etc.)
 */
export function ErrorMessage({
  message,
  variant = "field",
  className,
  showIcon = false,
  dismissible = false,
  onDismiss,
  icon: Icon = AlertTriangle,
}: ErrorMessageProps) {
  if (!message) return null;

  const baseClasses = "flex items-start gap-2";

  const variantClasses = {
    field: "text-sm text-destructive mt-1",
    form: "text-sm text-destructive text-center",
    alert: "rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error",
    inline: "text-xs text-error",
  };

  const iconClasses = {
    field: "w-4 h-4 mt-0.5 flex-shrink-0",
    form: "w-4 h-4 mx-auto flex-shrink-0",
    alert: "w-4 h-4 flex-shrink-0",
    inline: "w-3 h-3 flex-shrink-0",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {showIcon && <Icon className={iconClasses[variant]} />}
      <span className="flex-1">{message}</span>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 hover:bg-error/20 rounded transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Convenience component for field-level validation errors
 */
export function FieldError({ message, className, ...props }: Omit<ErrorMessageProps, "variant">) {
  return (
    <ErrorMessage
      message={message}
      variant="field"
      className={className}
      {...props}
    />
  );
}

/**
 * Convenience component for form-level submission errors
 */
export function FormError({ message, className, showIcon = true, ...props }: Omit<ErrorMessageProps, "variant">) {
  return (
    <ErrorMessage
      message={message}
      variant="form"
      showIcon={showIcon}
      className={className}
      {...props}
    />
  );
}

/**
 * Convenience component for alert-style error messages
 */
export function AlertError({ message, className, showIcon = true, ...props }: Omit<ErrorMessageProps, "variant">) {
  return (
    <ErrorMessage
      message={message}
      variant="alert"
      showIcon={showIcon}
      className={className}
      {...props}
    />
  );
}

/**
 * Convenience component for inline error messages
 */
export function InlineError({ message, className, ...props }: Omit<ErrorMessageProps, "variant">) {
  return (
    <ErrorMessage
      message={message}
      variant="inline"
      className={className}
      {...props}
    />
  );
}