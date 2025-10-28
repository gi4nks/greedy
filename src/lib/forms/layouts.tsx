"use client";

import React, { ReactNode } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, FormActions, FormTabs } from "./components";
import { ErrorHandler } from "@/lib/error-handler";

/**
 * Standardized form layouts for consistent structure across all entity forms
 */

/**
 * Standard entity form wrapper with consistent error handling and layout
 */
export function StandardEntityForm({
  mode,
  entity,
  action,
  children,
  title,
  redirectPath,
  campaignId,
  className = "",
  showDelete = false,
  onDelete
}: {
  mode: "create" | "edit";
  entity?: { id?: number };
  action: (prevState: { success: boolean; error?: string }, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  children: ReactNode;
  title: string;
  redirectPath: string;
  campaignId?: number;
  className?: string;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, { success: false });

  React.useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess(`${title} ${mode === "create" ? "created" : "updated"} successfully!`);
      router.push(redirectPath);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, `${mode} ${title.toLowerCase()}`);
    }
  }, [state, mode, title, router, redirectPath]);

  return (
    <form action={formAction} className={`space-y-6 ${className}`}>
      {campaignId && <input type="hidden" name="campaignId" value={campaignId.toString()} />}
      {mode === "edit" && entity?.id && <input type="hidden" name="id" value={entity.id.toString()} />}

      <FormSection title={title}>
        {children}
      </FormSection>

      <FormActions
        isPending={isPending}
        mode={mode}
        onCancel={() => router.back()}
        showDelete={showDelete}
        onDelete={onDelete}
      />
    </form>
  );
}

/**
 * Tabbed entity form layout for complex forms with multiple sections
 */
export function TabbedEntityForm({
  mode,
  entity,
  action,
  tabs,
  title,
  redirectPath,
  campaignId,
  defaultTab,
  className = "",
  showDelete = false,
  onDelete
}: {
  mode: "create" | "edit";
  entity?: { id?: number };
  action: (prevState: { success: boolean; error?: string }, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    badge?: string | number;
  }>;
  title: string;
  redirectPath: string;
  campaignId?: number;
  defaultTab?: string;
  className?: string;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, { success: false });

  React.useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess(`${title} ${mode === "create" ? "created" : "updated"} successfully!`);
      router.push(redirectPath);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, `${mode} ${title.toLowerCase()}`);
    }
  }, [state, mode, title, router, redirectPath]);

  return (
    <form action={formAction} className={`space-y-6 ${className}`}>
      {campaignId && <input type="hidden" name="campaignId" value={campaignId.toString()} />}
      {mode === "edit" && entity?.id && <input type="hidden" name="id" value={entity.id.toString()} />}

      <FormTabs tabs={tabs} defaultValue={defaultTab} />

      <div className="divider"></div>

      <FormActions
        isPending={isPending}
        mode={mode}
        onCancel={() => router.back()}
        showDelete={showDelete}
        onDelete={onDelete}
      />
    </form>
  );
}

/**
 * Simple form layout for basic create/edit operations
 */
export function SimpleEntityForm({
  mode,
  entity,
  action,
  children,
  title,
  redirectPath,
  campaignId,
  className = ""
}: {
  mode: "create" | "edit";
  entity?: { id?: number };
  action: (prevState: { success: boolean; error?: string }, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  children: ReactNode;
  title: string;
  redirectPath: string;
  campaignId?: number;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, { success: false });

  React.useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess(`${title} ${mode === "create" ? "created" : "updated"} successfully!`);
      router.push(redirectPath);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, `${mode} ${title.toLowerCase()}`);
    }
  }, [state, mode, title, router, redirectPath]);

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <form action={formAction} className="space-y-6">
        {campaignId && <input type="hidden" name="campaignId" value={campaignId.toString()} />}
        {mode === "edit" && entity?.id && <input type="hidden" name="id" value={entity.id.toString()} />}

        <div className="space-y-4">
          {children}
        </div>

        <FormActions
          isPending={isPending}
          mode={mode}
          onCancel={() => router.back()}
        />
      </form>
    </div>
  );
}