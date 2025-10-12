import { MagicItemCard } from '@/components/magic-items/MagicItemCard';
import type { MagicItemWithAssignments } from '@/lib/actions/magicItems';
import { Card, CardContent } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';

interface MagicItemsListProps {
  items: MagicItemWithAssignments[];
}

export function MagicItemsList({ items }: MagicItemsListProps) {
  if (items.length === 0) {
    return (
      <Card className="border-base-200 bg-base-100 text-center">
        <CardContent className="py-12">
          <PackageOpen className="mx-auto mb-4 h-12 w-12 text-base-content/50" />
          <p className="text-base font-medium text-base-content/80">No magic items yet.</p>
          <p className="mt-2 text-sm text-base-content/60">Create one or import from the Wiki.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <MagicItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
