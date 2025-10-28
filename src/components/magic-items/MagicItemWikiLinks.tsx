"use client";

import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MagicItemWithAssignments } from "@/lib/actions/magicItems";

interface MagicItemWikiLinksProps {
  item: MagicItemWithAssignments;
}

export function MagicItemWikiLinks({ item }: MagicItemWikiLinksProps) {
  // Only show for wiki items
  if (item.source !== "wiki") {
    return null;
  }

  // For now, we'll show a placeholder since we don't have wiki article linking implemented
  // This would typically link to the original wiki article
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Wiki Article
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-500 text-white">
                Wiki Source
              </Badge>
              <span className="text-sm text-base-content/70">
                This item was imported from the D&D 5e Tools wiki
              </span>
            </div>
          </div>

          <div className="text-sm text-base-content/60">
            <p>
              Wiki items are read-only and cannot be edited. You can view the original article
              or search for similar items in the wiki.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <ExternalLink className="w-4 h-4" />
              View Original Article
            </Button>
            <Link href="/wiki">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Browse Wiki
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}