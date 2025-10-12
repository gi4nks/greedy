"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Session } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/lib/actions/sessions";
import { Edit, Trash2, View } from "lucide-react";

interface SessionCardProps {
  session: Session & { campaignId?: number | null };
}

export function SessionCard({ session }: SessionCardProps) {
  const [isPending, startTransition] = useTransition();

  const displayText = session.text
    ? session.text.substring(0, 200) + (session.text.length > 200 ? "..." : "")
    : "";

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this session?')) {
      startTransition(async () => {
        try {
          await deleteSession(session.id);
        } catch (error) {
          console.error('Failed to delete session:', error);
          alert('Failed to delete session');
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg">{session.title}</CardTitle>
                        <span className="text-sm text-base-content/70">
              Session #{session.id}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">

        {displayText && (
          <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
            {displayText}
          </p>
        )}

        <div className="flex justify-between items-center text-xs text-base-content/70 mb-4">
          {session.adventureId && (
            <span>Adventure #{session.adventureId}</span>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Link
            href={`/sessions/${session.id}`}
          >
            <Button variant="warning" className="gap-2" size="sm">
              <View className="w-4 h-4" />
              View
            </Button>
          </Link>
          <Link
            href={session.campaignId ? `/campaigns/${session.campaignId}/sessions/${session.id}/edit` : `/sessions/${session.id}/edit`}
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
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}