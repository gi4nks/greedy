import Link from "next/link";
import { Session } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils/date";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { Edit } from "lucide-react";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface SessionHeaderProps {
  session: Session & {
    campaignId?: number | null;
    wikiEntities?: WikiEntity[];
  };
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
          <div className="space-y-1">
            <p className="text-lg text-base-content/70">
              {formatDate(session.date)}
            </p>
            {session.adventureId && (
              <p className="text-sm text-base-content/70">
                Adventure #{session.adventureId}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Link
            href={
              session.campaignId
                ? `/campaigns/${session.campaignId}/sessions/${session.id}/edit`
                : `/sessions/${session.id}/edit`
            }
          >
            <Button variant="secondary" className="gap-2" size="sm">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Session Content */}
      {session.text && (
        <Card className="bg-base-100 shadow-sm">
          <CardContent className="p-6">
            <MarkdownRenderer content={session.text} className="prose-sm" />
          </CardContent>
        </Card>
      )}

      {/* Wiki Items */}
      {session.wikiEntities && session.wikiEntities.length > 0 && (
        <Card className="bg-base-100 shadow-sm">
          <CardContent className="p-6">
            <WikiEntitiesDisplay
              wikiEntities={session.wikiEntities}
              entityType="session"
              entityId={session.id}
              showImportMessage={true}
              isEditable={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Metadata Footer */}
      <Card className="bg-base-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-base-content/70">
            <div>Created: {formatDisplayDate(session.createdAt)}</div>
            {session.updatedAt && session.updatedAt !== session.createdAt && (
              <div>Updated: {formatDisplayDate(session.updatedAt)}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
