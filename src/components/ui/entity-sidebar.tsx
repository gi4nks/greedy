"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUIDate } from "@/lib/utils/date";

interface EntitySidebarProps {
  metadata?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    campaign?: {
      id: number;
      title: string;
    } | null;
    gameEdition?: {
      name: string;
      version?: string;
    } | null;
  };
  quickActions?: ReactNode;
  additionalContent?: ReactNode;
  className?: string;
  metadataVariant?: "default" | "compact";
}

export function EntitySidebar({
  metadata,
  quickActions,
  additionalContent,
  className = ""
}: EntitySidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      {quickActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {metadata && (
        <Card className="bg-gradient-to-br from-base-100 to-base-100/50 border-base-300">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-bold text-base-content">
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 px-4 pb-3">
            {/* Top Row: Campaign & Game Edition */}
            <div className="grid grid-cols-2 gap-3">
              {/* Campaign */}
              {metadata.campaign && (
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50">
                    Campaign
                  </div>
                  <div className="text-xs font-medium text-base-content line-clamp-2">
                    {metadata.campaign.title}
                  </div>
                </div>
              )}

              {/* Game Edition */}
              {metadata.gameEdition && (
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50">
                    Edition
                  </div>
                  <div className="text-xs text-base-content">
                    <span className="font-medium">{metadata.gameEdition.name}</span>
                    {metadata.gameEdition.version && (
                      <span className="text-base-content/60 text-[10px]">
                        {` · v${metadata.gameEdition.version}`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Row: Created & Updated Dates */}
            {(metadata.createdAt || metadata.updatedAt) && (
              <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-base-200">
                {metadata.createdAt && (
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50">
                      Created
                    </div>
                    <div className="text-xs text-base-content/70">
                      {formatUIDate(metadata.createdAt) || "—"}
                    </div>
                  </div>
                )}
                {metadata.updatedAt && metadata.updatedAt !== metadata.createdAt && (
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50">
                      Updated
                    </div>
                    <div className="text-xs text-base-content/70">
                      {formatUIDate(metadata.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Content */}
      {additionalContent}
    </div>
  );
}
