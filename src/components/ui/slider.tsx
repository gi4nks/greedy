"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  HTMLInputElement,
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "defaultValue"
  > & {
    value?: number[];
    onValueChange?: (value: number[]) => void;
    defaultValue?: number[];
    max?: number;
    min?: number;
    step?: number;
  }
>(
  (
    {
      className,
      value,
      onValueChange,
      defaultValue,
      max = 100,
      min = 0,
      step = 1,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      value?.[0] ?? defaultValue?.[0] ?? min,
    );

    const currentValue = value?.[0] ?? internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.([newValue]);
    };

    return (
      <input
        ref={ref}
        type="range"
        className={cn("range range-primary w-full", className)}
        value={currentValue}
        onChange={handleChange}
        max={max}
        min={min}
        step={step}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
