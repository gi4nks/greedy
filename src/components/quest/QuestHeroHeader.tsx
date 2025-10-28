"use client";

import Link from "next/link";
import { Target, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/ui/hero-header";

interface QuestHeroHeaderProps {
  quest: {
    id: number;
    title: string;
    description: string | null;
    status: string | null;
    priority: string | null;
    type: string | null;
    dueDate: string | null;
    assignedTo: string | null;
    tags: unknown;
  };
  campaignId: number;
  adventureId: number;
}

export function QuestHeroHeader({ quest, campaignId, adventureId }: QuestHeroHeaderProps) {
  // Parse tags
  let tags: string[] = [];
  try {
    tags = typeof quest.tags === "string" ? JSON.parse(quest.tags) : quest.tags || [];
  } catch {
    tags = [];
  }

  const badges = [
    quest.status ? {
      label: quest.status,
      variant: quest.status === "completed" ? "default" : "secondary"
    } as const : null,
    quest.priority ? {
      label: quest.priority,
      variant: quest.priority === "high" ? "secondary" : quest.priority === "medium" ? "secondary" : "outline"
    } as const : null,
    quest.type ? {
      label: quest.type,
      variant: "outline"
    } as const : null,
    ...tags.map(tag => ({
      label: tag,
      variant: "secondary" as const
    }))
  ].filter((badge): badge is NonNullable<typeof badge> => badge !== null);

  const actions = (
    <Link href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${quest.id}/edit`}>
      <Button variant="secondary" size="sm" className="gap-2">
        <Edit className="w-4 h-4" />
        Edit
      </Button>
    </Link>
  );

  return (
    <HeroHeader
      icon={<Target className="w-8 h-8 text-primary" />}
      title={quest.title}
      subtitle={quest.description || undefined}
      badges={badges}
      actions={actions}
    />
  );
}