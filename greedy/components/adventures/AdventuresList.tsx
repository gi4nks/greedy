"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { BookOpen, Edit, Trash2, View } from "lucide-react";
import { deleteAdventureAction } from "@/lib/actions/adventures";
import { formatDate } from "@/lib/utils/date";
import type { Adventure } from "@/lib/db/schema";

interface AdventuresListProps {
  adventures: Adventure[];
  campaignId: number;
}

export function AdventuresList({
  adventures,
  campaignId,
}: AdventuresListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (adventureId: number) => {
    if (confirm("Are you sure you want to delete this adventure?")) {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("id", adventureId.toString());
          formData.append("campaignId", campaignId.toString());
          await deleteAdventureAction(formData);
        } catch (error) {
          console.error("Failed to delete adventure:", error);
          alert("Failed to delete adventure");
        }
      });
    }
  };

  if (adventures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <BookOpen className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No adventures yet</h3>
          <p className="text-base-content/70 mb-4">
            Create your first adventure to start organizing your campaign story.
          </p>
        </div>
        <Link href={`/campaigns/${campaignId}/adventures/create`}>
          <Button size="sm" variant="primary">
            <BookOpen className="w-4 h-4 mr-2" />
            Create First Adventure
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {adventures.map((adventure) => {
        const getStatusColor = (status: string | null) => {
          switch (status?.toLowerCase()) {
            case "active":
              return "default";
            case "completed":
              return "secondary";
            case "paused":
              return "outline";
            case "planning":
              return "outline";
            default:
              return "outline";
          }
        };

        return (
          <Card
            key={adventure.id}
            className="hover:shadow-lg transition-shadow h-full flex flex-col"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{adventure.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(adventure.status)}>
                        {adventure.status || "Active"}
                      </Badge>
                      {adventure.startDate && (
                        <span className="text-xs text-base-content/70">
                          Started: {formatDate(adventure.startDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-0">
              <div className="space-y-4 flex-1">
                {adventure.description && (
                  <div className="max-h-32 overflow-hidden">
                    <MarkdownRenderer
                      content={adventure.description}
                      className="prose-sm text-base-content/70"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-base-content/70">
                  {adventure.slug && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono bg-base-200 px-2 py-1 rounded">
                        {adventure.slug}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-auto">
                <Link
                  href={`/campaigns/${campaignId}/adventures/${adventure.id}`}
                >
                  <Button variant="warning" className="gap-2" size="sm">
                    <View className="w-4 h-4" />
                    View
                  </Button>
                </Link>
                <Link
                  href={`/campaigns/${campaignId}/adventures/${adventure.id}/edit`}
                >
                  <Button variant="secondary" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="neutral"
                  className="gap-2"
                  size="sm"
                  onClick={() => handleDelete(adventure.id)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
