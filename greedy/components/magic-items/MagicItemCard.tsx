"use client";

import Link from "next/link";
import { Edit, Trash2, Images, View } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { deleteMagicItemAction } from "@/lib/actions/magicItems";
import type { MagicItemWithAssignments } from "@/lib/actions/magicItems";

interface MagicItemCardProps {
  item: MagicItemWithAssignments;
}

export function MagicItemCard({ item }: MagicItemCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", item.id.toString());

      const result = await deleteMagicItemAction(undefined, formData);

      if (!result.success && result.message) {
        alert(result.message);
      } else {
        router.push("/magic-items");
      }
    } catch (error) {
      console.error("Failed to delete magic item:", error);
      alert("Failed to delete magic item. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  const assignmentBadges =
    item.assignments.length > 0
      ? item.assignments.slice(0, 3).map((assignment) => (
          <Badge
            key={`${assignment.entityType}-${assignment.entityId}`}
            variant="secondary"
            className="capitalize"
          >
            {assignment.entityType} • {assignment.entityName ?? "Unnamed"}
          </Badge>
        ))
      : null;

  const sortedAssignments = [...item.assignments]
    .sort((a, b) => {
      const aTime = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const bTime = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  const primaryImage = Array.isArray(item.images)
    ? item.images[0]
    : typeof item.images === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(item.images);
            return Array.isArray(parsed) ? parsed[0] : null;
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      {primaryImage && typeof primaryImage === "string" ? (
        <div className="relative h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-base-200 text-base-content/50">
          <Images className="h-10 w-10" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold line-clamp-1">
            {item.name}
          </CardTitle>
          <Badge
            variant={item.source === "wiki" ? "default" : "outline"}
            className={`capitalize ${item.source === "wiki" ? "bg-blue-500 text-white" : ""}`}
          >
            {item.source}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap gap-2 text-xs text-base-content/70">
            {item.rarity && (
              <Badge variant="outline" className="capitalize">
                {item.rarity}
              </Badge>
            )}
            {item.type && (
              <Badge variant="secondary" className="capitalize">
                {item.type}
              </Badge>
            )}
            {item.attunementRequired && (
              <Badge variant="secondary" className="bg-emerald-500 text-white">
                Attunement required
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-base-content/70 line-clamp-3">
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {assignmentBadges ?? (
              <span className="text-base-content/60">No assignments yet</span>
            )}
          </div>

          {sortedAssignments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Recent assignments
              </p>
              <ul className="space-y-1 text-sm">
                {sortedAssignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate capitalize">
                      {assignment.entityType}: {assignment.entityName}
                    </span>
                    {assignment.campaignTitle && (
                      <span className="truncate text-xs text-base-content/60">
                        {assignment.campaignTitle}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 mt-auto">
          <Link href={`/magic-items/${item.id}`} className="flex-1">
            <Button variant="warning" className="gap-2 w-full">
              <View className="w-4 h-4" />
              View
            </Button>
          </Link>
          <Link href={`/magic-items/${item.id}/edit`}>
            <Button variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="neutral"
            className="gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
