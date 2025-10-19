"use client";

import Link from "next/link";
import { Edit, Trash2, View } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  const assignmentCount = item.assignments.length;

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="card-title text-lg font-bold line-clamp-2">
            {item.name}
          </h3>
          <Badge
            variant={item.source === "wiki" ? "default" : "outline"}
            className={`capitalize text-xs whitespace-nowrap ${item.source === "wiki" ? "bg-blue-500 text-white" : ""}`}
          >
            {item.source}
          </Badge>
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col p-5 pt-0">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap gap-1 text-xs">
            {item.rarity && (
              <Badge variant="outline" className="capitalize text-xs">
                {item.rarity}
              </Badge>
            )}
            {item.type && (
              <Badge variant="secondary" className="capitalize text-xs">
                {item.type}
              </Badge>
            )}
            {item.attunementRequired && (
              <Badge variant="secondary" className="bg-emerald-500 text-white text-xs">
                Attuned
              </Badge>
            )}
          </div>

          {item.description && (
            <div className="text-base-content/70 line-clamp-2 max-h-10 text-sm [&>div]:m-0 [&>p]:m-0">
              <MarkdownRenderer content={item.description} className="!prose-sm [&>*]:!m-0 [&>*]:!p-0" />
            </div>
          )}

          {assignmentCount > 0 && (
            <div className="text-xs text-base-content/60 pt-1">
              {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 mt-auto">
          <Link href={`/magic-items/${item.id}`} className="flex-1">
            <Button variant="warning" className="gap-2 w-full" size="sm">
              <View className="w-4 h-4" />
              View
            </Button>
          </Link>
          <Link href={`/magic-items/${item.id}/edit`} className="flex-1">
            <Button variant="secondary" className="gap-2 w-full" size="sm">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="neutral"
            className="gap-2 flex-1 w-full"
            size="sm"
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
