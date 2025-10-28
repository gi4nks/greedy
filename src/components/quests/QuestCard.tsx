"use client";

import Link from "next/link";
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
} from "lucide-react";
import { formatUIDate } from "@/lib/utils/date";
import { deleteQuest } from "@/lib/actions/quests";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Quest {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  adventureId: number | null;
}

interface QuestCardProps {
  quest: Quest;
  campaignId: number;
  adventureId: number;
}

function getStatusIcon(status: string) {
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

function getPriorityIcon(priority: string) {
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

function getTypeIcon(type: string) {
  switch (type) {
    case "main":
      return <Star className="w-4 h-4 text-yellow-500" />;
    case "side":
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/70" />;
  }
}

export default function QuestCard({ quest, campaignId, adventureId }: QuestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${quest.title}"? This action cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteQuest(quest.id, campaignId);
        if (result.success) {
          router.refresh();
        } else {
          alert("Failed to delete quest. Please try again.");
        }
      });
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(quest.status || "active")}
            <Badge
              variant={
                quest.status === "completed" ? "default" : "secondary"
              }
            >
              {quest.status || "active"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {getPriorityIcon(quest.priority || "medium")}
            {getTypeIcon(quest.type || "main")}
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">
          {quest.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {quest.description && (
            <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
              {quest.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-base-content/70 mb-3">
            <span className="capitalize">
              {quest.type || "main"} quest
            </span>
            <span className="capitalize">
              {quest.priority || "medium"} priority
            </span>
          </div>

          {quest.dueDate && (
            <div className="flex items-center gap-1 text-xs text-base-content/70 mb-3">
              <Clock className="w-3 h-3" />
              Due: {formatUIDate(quest.dueDate)}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <Link
            href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${quest.id}`}
            className="flex-1"
          >
            <Button
              variant="warning"
              className="gap-2 w-full"
              size="sm"
            >
              <View className="w-4 h-4" />
              View
            </Button>
          </Link>
          <Link
            href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${quest.id}/edit`}
          >
            <Button variant="secondary" className="gap-2" size="sm">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="neutral"
            className="gap-2"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}