import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "avatar",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & {
    onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
  }
>(({ className, onLoadingStatusChange, onLoad, onError, ...props }, ref) => {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  React.useEffect(() => {
    if (props.src) {
      setImageLoadingStatus('loading');
    }
  }, [props.src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoadingStatus('loaded');
    onLoadingStatusChange?.('loaded');
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoadingStatus('error');
    onLoadingStatusChange?.('error');
    onError?.(e);
  };

  if (imageLoadingStatus === 'error') {
    return null;
  }

  return (
    <img
      ref={ref}
      className={cn("w-10 h-10 rounded-full", className)}
      alt=""
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-10 items-center justify-center rounded-full bg-neutral text-neutral-content placeholder",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }