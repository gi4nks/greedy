'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { MagicItemAssignableEntity } from '@/lib/magicItems/shared';
import { Trash2 } from 'lucide-react';

interface UnassignMagicItemButtonProps {
  itemId: number;
  entityType: MagicItemAssignableEntity;
  entityId: number;
}

export function UnassignMagicItemButton({ itemId, entityType, entityId }: UnassignMagicItemButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnassign = () => {
    startTransition(async () => {
      try {
        setError(null);
        const params = new URLSearchParams({ entityType, entityId: String(entityId) });
        const response = await fetch(`/api/magic-items/${itemId}/assign?${params.toString()}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? 'Failed to remove assignment.');
        }

        router.refresh();
      } catch (caught) {
        console.error('Failed to unassign magic item', caught);
        setError((caught as Error).message || 'Failed to remove assignment.');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="gap-2"
        onClick={handleUnassign}
        disabled={isPending}
      >
        <Trash2 className="w-4 h-4" />
        {isPending ? 'Removing…' : 'Unassign'}
      </Button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
