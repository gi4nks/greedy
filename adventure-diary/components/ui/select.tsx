import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  getLabelForValue?: (val: string) => string;
  triggerRef?: React.RefObject<HTMLDivElement | null>;
}

const SelectContext = React.createContext<SelectContextType>({});

const getTextContentFromNode = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return node.toString();
  if (React.isValidElement(node)) {
    const props = node.props as any;
    if (props.children) {
      return getTextContentFromNode(props.children);
    }
  }
  if (Array.isArray(node)) {
    return node.map(getTextContentFromNode).join('');
  }
  return '';
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
>(({ value, defaultValue, onValueChange, children, className, name, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<string>("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  
  // Determine the current value (controlled vs uncontrolled)
  const currentValue = value !== undefined ? value : internalValue;
  
  // Memoized function to get label from children
  const getLabelFromChildren = React.useMemo(() => {
    return (val: string) => {
      let label = '';
      if (val) {
        const findLabel = (nodes: React.ReactNode) => {
          React.Children.forEach(nodes, (child) => {
            if (React.isValidElement(child)) {
              const childProps = child.props as { children?: React.ReactNode; value?: string };
              if ((child.type as any).displayName === 'SelectItem' && childProps.value === val) {
                label = getTextContentFromNode(childProps.children);
              } else if (childProps.children) {
                findLabel(childProps.children);
              }
            }
          });
        };
        findLabel(children);
      }
      return label;
    };
  }, [children]);
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      // Uncontrolled component
      setInternalValue(newValue);
    }
    // Controlled component
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  // Calculate optimal dropdown position
  const calculateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return "";

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Simple positioning logic: prefer bottom-right, but switch to top or left if needed
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const spaceRight = viewportWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;
    
    // Estimate dropdown size
    const dropdownHeight = 200; // Conservative estimate
    const dropdownWidth = Math.max(triggerRect.width, 200);
    
    let positionClasses = "";
    
    // Vertical positioning
    if (spaceBelow >= dropdownHeight) {
      positionClasses += " dropdown-bottom";
    } else if (spaceAbove >= dropdownHeight) {
      positionClasses += " dropdown-top";
    } else {
      // Default to bottom if neither has enough space
      positionClasses += " dropdown-bottom";
    }
    
    // Horizontal positioning - prefer aligning with the trigger's edge
    if (spaceRight >= dropdownWidth) {
      positionClasses += " dropdown-end";
    } else if (spaceLeft >= dropdownWidth) {
      positionClasses += " dropdown-left";
    } else {
      // Default to end if neither has enough space
      positionClasses += " dropdown-end";
    }
    
    return positionClasses;
  }, []);

  // Update position when dropdown opens or window resizes
  React.useEffect(() => {
    if (isOpen) {
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
    }
  }, [isOpen, calculateDropdownPosition]);

  // Recalculate position on window resize and scroll
  React.useEffect(() => {
    const handleResizeOrScroll = () => {
      if (isOpen) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true); // Capture scroll events
    
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, calculateDropdownPosition]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen,
      getLabelForValue: getLabelFromChildren,
      triggerRef
    }}>
      <div 
        ref={dropdownRef} 
        className={cn("dropdown relative", dropdownPosition, isOpen && "dropdown-open", className)} 
        {...props}
      >
        {name && (
          <input type="hidden" name={name} value={currentValue} />
        )}
        {children}
      </div>
    </SelectContext.Provider>
  );
});
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
  const resolvedLabel = value ? getLabelForValue?.(value) : '';
  const displayText = resolvedLabel || value || placeholder;
  const isPlaceholder = !value && !resolvedLabel;
  
  return (
    <span 
      ref={ref} 
      className={cn(
        "flex-1 text-left",
        isPlaceholder && "opacity-50",
        className
      )} 
      {...props}
    >
      {displayText}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { setIsOpen, triggerRef } = React.useContext(SelectContext);
  
  const handleClick = () => {
    setIsOpen?.(prev => !prev);
  };

  // Use the triggerRef from context if available, otherwise use the passed ref
  const triggerElementRef = triggerRef || ref;

  return (
    <div 
      ref={triggerElementRef} 
      tabIndex={0} 
      role="button"
      onClick={handleClick}
      className={cn("input input-bordered w-full flex items-center justify-between cursor-pointer h-12 px-4 leading-none dropdown-toggle", className)} 
      {...props}
    >
      {children}
      <ChevronDown className="w-4 h-4 text-base-content/50 flex-shrink-0 ml-2" />
    </div>
  );
});

const SelectContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement> & {
    position?: string;
  }
>(({ className, children, position, ...props }, ref) => (
  <ul ref={ref} className={cn("dropdown-content p-2 shadow bg-base-100 rounded-box z-[200] min-w-full w-max max-h-96 overflow-auto max-w-xs", className)} {...props}>
    {children}
  </ul>
));
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("text-sm font-semibold text-base-content/70 px-4 py-3 flex items-center h-10 leading-none", className)} {...props} />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & {
    value: string;
    children: React.ReactNode;
  }
>(({ className, children, value, ...props }, ref) => {
  const { onValueChange, value: selectedValue, setIsOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onValueChange?.(value);
    setIsOpen?.(false); // Close dropdown after selection
  };

  return (
    <li ref={ref} className={className} {...props}>
      <a 
        onClick={handleClick} 
        className={cn("cursor-pointer whitespace-nowrap flex items-center h-10 px-4 leading-none", isSelected && "active")}
        data-select-value={value}
      >
        {children}
      </a>
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
}