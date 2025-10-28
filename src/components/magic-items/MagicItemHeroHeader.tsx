"use client";

import Link from "next/link";
import { Wand2, Edit, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/ui/hero-header";
import type { MagicItemWithAssignments } from "@/lib/actions/magicItems";

interface MagicItemHeroHeaderProps {
  item: MagicItemWithAssignments;
  onDelete?: () => void;
}

export function MagicItemHeroHeader({ item, onDelete }: MagicItemHeroHeaderProps) {
  const assignmentCount = item.assignments.length;

  const badges = [
    item.rarity ? { label: item.rarity, variant: "outline" as const } : null,
    item.type ? { label: item.type, variant: "secondary" as const } : null,
    item.attunementRequired ? {
      label: "Attunement required",
      variant: "secondary" as const,
      className: "bg-emerald-500 text-white"
    } : null,
    item.source === "wiki" ? {
      label: "Wiki",
      variant: "default" as const,
      className: "bg-blue-500 text-white"
    } : null,
    assignmentCount > 0 ? {
      label: `${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}`,
      variant: "outline" as const
    } : null
  ].filter((badge): badge is NonNullable<typeof badge> => badge !== null);

  const actions = (
    <div className="flex gap-2">
      <Link href={`/magic-items/${item.id}/edit`}>
        <Button variant="secondary" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </Link>
      <Button
        variant="primary"
        size="sm"
        className="gap-2"
        onClick={() => {
          // Assignment functionality would be handled by parent component
        }}
      >
        <UserPlus className="w-4 h-4" />
        Assign
      </Button>
      {onDelete && (
        <Button
          variant="neutral"
          size="sm"
          className="gap-2"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <HeroHeader
      icon={<Wand2 className="w-8 h-8 text-primary" />}
      title={item.name}
      subtitle={item.description || undefined}
      badges={badges}
      actions={actions}
    />
  );
}