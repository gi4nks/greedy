import Link from 'next/link';
import { MagicItemForm } from '@/components/magic-items/MagicItemForm';
import { Button } from '@/components/ui/button';

export default function NewMagicItemPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Add Magic Item</h1>
          <p className="text-sm text-base-content/70">
            Define a new magic item to manage across campaigns and assignments.
          </p>
        </div>
      </div>

      <MagicItemForm mode="create" />
    </div>
  );
}
