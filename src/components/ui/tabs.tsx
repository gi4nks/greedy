import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const TabsContext = React.createContext<TabsContextType>({});

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(
  (
    { defaultValue, value, onValueChange, className, children, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      value || defaultValue || "",
    );

    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [value, onValueChange],
    );

    return (
      <TabsContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          defaultValue,
        }}
      >
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("tabs tabs-boxed bg-base-200 p-1", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    value: string;
    children: React.ReactNode;
  }
>(({ className, value, children, ...props }, ref) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onValueChange?.(value);
  };

  return (
    <a
      ref={ref}
      className={cn("tab", isActive && "tab-active", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
  }
>(({ className, value, ...props }, ref) => {
  const { value: currentValue } = React.useContext(TabsContext);

  if (currentValue !== value) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("mt-2 focus:outline-none", className)}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
