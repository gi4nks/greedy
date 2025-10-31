import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  getLabelForValue?: (val: string) => string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  contentRef?: React.RefObject<HTMLElement | null>;
  selectedIndex?: number;
  setSelectedIndex?: React.Dispatch<React.SetStateAction<number>>;
  items?: Array<{ value: string; label: string }>;
  listboxId?: string;
}

const SelectContext = React.createContext<SelectContextType>({});

const getTextContentFromNode = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return node.toString();
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children) {
      return getTextContentFromNode(props.children);
    }
  }
  if (Array.isArray(node)) {
    return node.map(getTextContentFromNode).join("");
  }
  return "";
};

const Select = React.forwardRef<
  HTMLDivElement,
  {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
    name?: string;
  }
>(
  (
    { value, defaultValue, onValueChange, children, className, name, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue || "",
    );
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const triggerRef = React.useRef<HTMLElement>(null);
    const contentRef = React.useRef<HTMLElement>(null);
    const listboxId = React.useId();

    // Determine the current value (controlled vs uncontrolled)
    const currentValue = value !== undefined ? value : internalValue;

    // Collect items from children
    const items = React.useMemo(() => {
      const collected: Array<{ value: string; label: string }> = [];
      const collectItems = (nodes: React.ReactNode) => {
        React.Children.forEach(nodes, (child) => {
          if (React.isValidElement(child)) {
            const childProps = child.props as {
              children?: React.ReactNode;
              value?: string;
            };
            if (
              (child.type as { displayName?: string }).displayName ===
                "SelectItem" &&
              childProps.value
            ) {
              collected.push({
                value: childProps.value,
                label: getTextContentFromNode(childProps.children),
              });
            } else if (childProps.children) {
              collectItems(childProps.children);
            }
          }
        });
      };
      collectItems(children);
      return collected;
    }, [children]);

    // Memoized function to get label from children
    const getLabelFromChildren = React.useMemo(() => {
      return (val: string) => {
        const item = items.find((i) => i.value === val);
        return item ? item.label : "";
      };
    }, [items]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (value === undefined) {
          // Uncontrolled component
          setInternalValue(newValue);
        }
        // Controlled component
        onValueChange?.(newValue);
        setIsOpen(false);
        setSelectedIndex(-1);
      },
      [value, onValueChange],
    );

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          contentRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !contentRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Update selected index when value changes
    React.useEffect(() => {
      const index = items.findIndex((item) => item.value === currentValue);
      setSelectedIndex(index);
    }, [currentValue, items]);

    return (
      <SelectContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          isOpen,
          setIsOpen,
          getLabelForValue: getLabelFromChildren,
          triggerRef,
          contentRef,
          selectedIndex,
          setSelectedIndex,
          items,
          listboxId,
        }}
      >
        <div
          ref={ref}
          className={cn("dropdown dropdown-bottom", isOpen && "dropdown-open", className)}
          {...props}
        >
          {name && <input type="hidden" name={name} value={currentValue} />}
          {children}
        </div>
      </SelectContext.Provider>
    );
  },
);
Select.displayName = "Select";

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
SelectGroup.displayName = "SelectGroup";

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  {
    placeholder?: string;
    className?: string;
  }
>(({ placeholder, className, ...props }, ref) => {
  const { value, getLabelForValue } = React.useContext(SelectContext);
  const resolvedLabel = value ? getLabelForValue?.(value) : "";
  const displayText = resolvedLabel || value || placeholder;
  const isPlaceholder = !value && !resolvedLabel;

  return (
    <span
      ref={ref}
      className={cn(
        "flex-1 text-left",
        isPlaceholder && "opacity-50",
        className,
      )}
      {...props}
    >
      {displayText}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const {
    setIsOpen,
    isOpen,
    triggerRef,
    selectedIndex,
    setSelectedIndex,
    items,
    onValueChange,
    listboxId,
  } = React.useContext(SelectContext);

  const handleClick = () => {
    setIsOpen?.((prev) => !prev);
  };

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen?.(true);
          setSelectedIndex?.(0);
        }
      } else {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex?.((prev) =>
              prev < (items?.length ?? 0) - 1 ? prev + 1 : 0,
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex?.((prev) =>
              prev > 0 ? prev - 1 : (items?.length ?? 0) - 1,
            );
            break;
          case "Enter":
            e.preventDefault();
            if (selectedIndex !== undefined && selectedIndex >= 0 && items?.[selectedIndex]) {
              onValueChange?.(items[selectedIndex].value);
            }
            break;
          case "Escape":
            e.preventDefault();
            setIsOpen?.(false);
            setSelectedIndex?.(-1);
            break;
        }
      }
    },
    [isOpen, selectedIndex, setSelectedIndex, items, onValueChange, setIsOpen],
  );

  // Merge refs
  const setRefs = React.useCallback((element: HTMLButtonElement | null) => {
    if (triggerRef) triggerRef.current = element;
    if (ref) {
      if (typeof ref === 'function') ref(element);
      else ref.current = element;
    }
  }, [triggerRef, ref]);

  return (
    <button
      ref={setRefs}
      type="button"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "input input-bordered w-full flex items-center justify-between cursor-pointer h-10 py-2 px-3 text-sm",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="w-4 h-4 text-base-content/50 flex-shrink-0 ml-2" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, contentRef, listboxId } = React.useContext(SelectContext);

  // Merge refs - must be before any early returns
  const setRefs = React.useCallback((element: HTMLUListElement | null) => {
    if (contentRef) contentRef.current = element;
    if (ref) {
      if (typeof ref === 'function') ref(element);
      else ref.current = element;
    }
  }, [contentRef, ref]);

  if (!isOpen) return null;

  return (
    <ul
      ref={setRefs}
      role="listbox"
      id={listboxId}
      className={cn(
        "dropdown-content z-[200] p-2 shadow bg-base-100 rounded-box border border-base-300 min-w-full max-h-96 overflow-auto",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "text-sm font-semibold text-base-content/70 px-3 py-2 flex items-center h-10 leading-none",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & {
    value: string;
    children: React.ReactNode;
  }
>(({ className, children, value, ...props }, ref) => {
  const {
    onValueChange,
    value: selectedValue,
    selectedIndex,
    setSelectedIndex,
    items,
  } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  const index = items?.findIndex((item) => item.value === value) ?? -1;
  const isHighlighted = selectedIndex === index;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.(value);
  };

  const handleMouseEnter = () => {
    setSelectedIndex?.(index);
  };

  return (
    <li
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis flex items-center h-10 px-3 leading-none rounded hover:bg-base-200",
        isSelected && "bg-base-200",
        isHighlighted && "bg-base-300",
        className,
      )}
      data-select-value={value}
      {...props}
    >
      {children}
    </li>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("divider", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

// Placeholder components for compatibility
const SelectScrollUpButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <div ref={ref} {...props} />);
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <div ref={ref} {...props} />);
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
