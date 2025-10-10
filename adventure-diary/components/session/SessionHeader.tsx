import Link from "next/link";
import { marked } from "marked";
import { Session } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils/date";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";

interface SessionHeaderProps {
  session: Session & { campaignId?: number | null; wikiEntities?: WikiEntity[] };
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{session.title}</h1>
            <p className="text-lg text-base-content/70 mt-1">
              {formatDate(session.date)}
            </p>
            {session.adventureId && (
              <p className="text-sm text-base-content/70 mt-1">
                Adventure #{session.adventureId}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <Link
              href={session.campaignId ? `/campaigns/${session.campaignId}/sessions/${session.id}/edit` : `/sessions/${session.id}/edit`}
            >
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {session.text && (
          <div className="prose prose-sm max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: marked(session.text, {
                  breaks: true,
                  gfm: true
                })
              }}
            />
          </div>
        )}

        {/* Wiki Items from Wiki Import */}
        {session.wikiEntities && session.wikiEntities.length > 0 && (
          <div className="mt-6">
            <WikiEntitiesDisplay
              wikiEntities={session.wikiEntities}
              entityType="session"
              entityId={session.id}
              showImportMessage={true}
              isEditable={false}
            />
          </div>
        )}

        {/* Images */}
        <div className="mt-6">
          <EntityImageCarousel
            images={parseImagesJson(session.images)}
            entityType="session"
          />
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-base-content/70">
            Created: {formatDisplayDate(session.createdAt)}
          </div>
          {session.updatedAt && session.updatedAt !== session.createdAt && (
            <div className="text-sm text-base-content/70">
              Updated: {formatDisplayDate(session.updatedAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}