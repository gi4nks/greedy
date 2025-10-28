"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/error-message";
import { Trash2 } from "lucide-react";
import { deleteMagicItemAction } from "@/lib/actions/magicItems";

interface DeleteMagicItemFormProps {
  itemId: number;
  itemName: string;
}

export function DeleteMagicItemForm({
  itemId,
  itemName,
}: DeleteMagicItemFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append("id", itemId.toString());

        const result = await deleteMagicItemAction(undefined, formData);

        if (!result.success && result.error) {
          setError(result.error);
        } else {
          router.push("/magic-items");
        }
      } catch (caught) {
        console.error("Failed to delete magic item", caught);
        setError((caught as Error).message || "Failed to delete magic item.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="neutral"
        className="gap-2"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="w-4 h-4" />
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      <InlineError message={error} />
    </div>
  );
}