"use client";

import React, { ReactNode } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, FormActions } from "@/components/ui/form-components";
import { ErrorHandler } from "@/lib/error-handler";

/**
 * Simplified form wrapper for consistent error handling and layout
 */
export function StandardEntityForm({
  mode,
  entity,
  action,
  children,
  title,
  redirectPath,
  campaignId,
}: {
  mode: "create" | "edit";
  entity?: { id?: number };
  action: (prevState: { success: boolean; error?: string }, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  children: ReactNode;
  title: string;
  redirectPath: string;
  campaignId?: number;
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
    <form action={formAction} className="space-y-6">
      {campaignId && <input type="hidden" name="campaignId" value={campaignId.toString()} />}
      {mode === "edit" && entity?.id && <input type="hidden" name="id" value={entity.id.toString()} />}

      <FormSection title={title}>
        {children}
      </FormSection>

      <FormActions
        isPending={isPending}
        mode={mode}
        onCancel={() => router.back()}
      />
    </form>
  );
}