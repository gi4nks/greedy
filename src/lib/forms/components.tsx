"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, EyeOff, Plus, Trash2 } from "lucide-react";

/**
 * Enhanced form components for consistent UI across all forms
 */

/**
 * Form section wrapper with consistent Card layout
 */
export function FormSection({
  title,
  children,
  className = "",
  collapsible = false,
  defaultExpanded = true
}: {
  title: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  if (collapsible) {
    return (
      <details className={`collapse collapse-arrow ${className}`} open={defaultExpanded}>
        <summary className="collapse-title text-xl font-medium">
          {title}
        </summary>
        <div className="collapse-content">
          <Card>
            <CardContent className="space-y-4 pt-4">
              {children}
            </CardContent>
          </Card>
        </div>
      </details>
    );
  }

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
 * Form tabs wrapper for multi-section forms
 */
export function FormTabs({
  tabs,
  defaultValue,
  className = ""
}: {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    badge?: string | number;
  }>;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue || tabs[0]?.id} className={`w-full ${className}`}>
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="relative">
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-content rounded-full">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="space-y-6 mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
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
  className = "",
  showDelete = false,
  onDelete,
  deleteLabel = "Delete"
}: {
  isPending: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  const defaultSubmitLabel = isPending
    ? (mode === "edit" ? "Updating..." : "Creating...")
    : (mode === "edit" ? "Update" : "Create");

  return (
    <div className={`flex gap-4 pt-4 justify-end ${className}`}>
      {showDelete && onDelete && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          {deleteLabel}
        </Button>
      )}
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
 * Dynamic array field for adding/removing items (like classes, tags, etc.)
 */
export function DynamicArrayField<T extends { id?: string | number }>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = "Add Item",
  emptyMessage = "No items added yet",
  className = ""
}: {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel?: string;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.length === 0 ? (
        <p className="text-sm text-base-content/60 italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                {renderItem(item, index)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-base-content/60 hover:text-error"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </Button>
    </div>
  );
}

/**
 * Form grid layout for consistent field arrangement
 */
export function FormGrid({
  children,
  columns = 1,
  className = ""
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <div className={`grid gap-4 ${gridClass} ${className}`}>
      {children}
    </div>
  );
}