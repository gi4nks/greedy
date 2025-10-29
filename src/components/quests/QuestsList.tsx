"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  Star,
  Edit,
  View,
  Trash2,
  Plus,
} from "lucide-react";
import { deleteQuestAction } from "@/lib/actions/quests";
import { formatUIDate } from "@/lib/utils/date";

type Quest = {
  id: number;
  adventureId: number;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  createdAt: string | null;
  adventureTitle: string;
};

interface QuestsListProps {
  quests: Quest[];
  campaignId: number;
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "active":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/70" />;
  }
}

function getPriorityIcon(priority: string | null) {
  switch (priority) {
    case "high":
      return <Flag className="w-4 h-4 text-red-500" />;
    case "medium":
      return <Flag className="w-4 h-4 text-yellow-500" />;
    case "low":
      return <Flag className="w-4 h-4 text-green-500" />;
    default:
      return <Flag className="w-4 h-4 text-base-content/70" />;
  }
}

function getTypeIcon(type: string | null) {
  switch (type) {
    case "main":
      return <Star className="w-4 h-4 text-yellow-500" />;
    case "side":
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/70" />;
  }
}

export function QuestsList({ quests, campaignId }: QuestsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (questId: number) => {
    if (confirm("Are you sure you want to delete this quest?")) {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("id", questId.toString());
          formData.append("campaignId", campaignId.toString());
          await deleteQuestAction(formData);
        } catch (error) {
          console.error("Failed to delete quest:", error);
          alert("Failed to delete quest");
        }
      });
    }
  };

  if (quests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <CheckCircle className="w-12 h-12 mx-auto text-base-content/70" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Quests Yet</h3>
          <p className="text-base-content/70 mb-4">
            Create quests by visiting your adventures. Each adventure can have its own quests.
          </p>
          <Link href={`/campaigns/${campaignId}/adventures`}>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Go to Adventures
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quests.map((quest) => (
        <Card key={quest.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(quest.status)}
                <Badge
                  variant={
                    quest.status === "completed" ? "default" : "secondary"
                  }
                >
                  {quest.status || "active"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {getPriorityIcon(quest.priority)}
                {getTypeIcon(quest.type)}
              </div>
            </div>
            <CardTitle className="text-lg line-clamp-2">{quest.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {quest.adventureTitle}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <div className="space-y-3 flex-1">
              {quest.description && (
                <p className="text-sm text-base-content/70 line-clamp-3">
                  {quest.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-base-content/70">
                <span className="capitalize">{quest.type || "main"} quest</span>
                <span className="capitalize">{quest.priority || "medium"} priority</span>
              </div>

              {quest.dueDate && (
                <div className="flex items-center gap-1 text-xs text-base-content/70">
                  <Clock className="w-3 h-3" />
                  Due: {formatUIDate(quest.dueDate)}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 mt-auto">
              <Link
                href={`/campaigns/${campaignId}/adventures/${quest.adventureId}/quests/${quest.id}`}
                className="flex-1"
              >
                <Button variant="warning" className="gap-2 w-full" size="sm">
                  <View className="w-4 h-4" />
                  View Details
                </Button>
              </Link>
              <Link
                href={`/campaigns/${campaignId}/adventures/${quest.adventureId}/quests/${quest.id}/edit`}
              >
                <Button variant="secondary" className="gap-2" size="sm">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="neutral"
                className="gap-2"
                onClick={() => handleDelete(quest.id)}
                disabled={isPending}
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}