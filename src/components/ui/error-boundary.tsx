"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback component to render when an error occurs */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show error details in development */
  showErrorDetails?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Custom title for the error */
  errorTitle?: string;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  errorMessage?: string;
  errorTitle?: string;
  showErrorDetails?: boolean;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  errorMessage = "Something went wrong. Please try again.",
  errorTitle = "Oops! An error occurred",
  showErrorDetails = false,
}: ErrorFallbackProps) {
  const handleRetry = () => {
    resetError();
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <CardTitle className="text-xl text-error">{errorTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-base-content/70">{errorMessage}</p>

          {showErrorDetails && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-base-content/60 hover:text-base-content">
                Error Details (Development)
              </summary>
              <div className="mt-2 rounded-md bg-base-200 p-3">
                <pre className="text-xs text-error overflow-auto">
                  {error.message}
                  {errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Stack:"}
                      {errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorMessage={this.props.errorMessage}
          errorTitle={this.props.errorTitle}
          showErrorDetails={this.props.showErrorDetails}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Convenience wrapper for entity pages
 */
export function EntityErrorBoundary({
  children,
  entityType = "entity",
  ...props
}: Omit<ErrorBoundaryProps, "errorMessage" | "errorTitle"> & {
  entityType?: string;
}) {
  return (
    <ErrorBoundary
      errorMessage={`Failed to load ${entityType}. Please try again.`}
      errorTitle={`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Error`}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook for handling async errors in functional components
 * This can be used to manually trigger error boundaries
 */
export function useErrorHandler() {
  return (error: Error) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
}