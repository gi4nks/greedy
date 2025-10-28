"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, EyeOff } from "lucide-react";

/**
 * Shared form layout components for consistent UI across all forms
 */

/**
 * Form section wrapper with consistent Card layout
 */
export function FormSection({
  title,
  children,
  className = ""
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Standard form actions (Save/Cancel buttons) with consistent layout
 */
export function FormActions({
  isPending,
  mode,
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
  className = ""
}: {
  isPending: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}) {
  const defaultSubmitLabel = isPending
    ? (mode === "edit" ? "Updating..." : "Creating...")
    : (mode === "edit" ? "Update" : "Create");

  return (
    <div className={`flex gap-4 pt-4 justify-end ${className}`}>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        size="sm"
        onClick={onCancel}
        disabled={isPending}
      >
        <EyeOff className="w-4 h-4" />
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        variant="primary"
      >
        <Save className="w-4 h-4 mr-2" />
        {submitLabel || defaultSubmitLabel}
      </Button>
    </div>
  );
}

/**
 * Generic form field wrapper with consistent styling
 */
export function FormField({
  label,
  required = false,
  error,
  help,
  children,
  className = ""
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {help && <p className="text-sm text-base-content/70">{help}</p>}
    </div>
  );
}

/**
 * Common form field components
 */
export function TitleField({
  value,
  onChange,
  placeholder = "Enter title",
  required = true,
  error,
  className = ""
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <FormField
      label="Title"
      required={required}
      error={error}
      className={className}
    >
      <input
        type="text"
        name="title"
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className="input input-bordered w-full"
        required={required}
      />
    </FormField>
  );
}

export function DescriptionField({
  value,
  onChange,
  placeholder = "Enter description",
  rows = 4,
  required = false,
  error,
  className = ""
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <FormField
      label="Description"
      required={required}
      error={error}
      className={className}
    >
      <textarea
        name="description"
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        rows={rows}
        className="textarea textarea-bordered w-full"
        required={required}
      />
    </FormField>
  );
}

export function StatusSelect({
  value,
  onChange,
  options,
  placeholder = "Select status",
  required = false,
  error,
  className = ""
}: {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <FormField
      label="Status"
      required={required}
      error={error}
      className={className}
    >
      <select
        name="status"
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="select select-bordered w-full"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function DateField({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  className = ""
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      className={className}
    >
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="input input-bordered w-full"
        required={required}
      />
    </FormField>
  );
}