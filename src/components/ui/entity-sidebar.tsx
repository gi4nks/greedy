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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign */}
            {metadata.campaign && (
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">
                  Campaign
                </div>
                <div className="text-sm text-base-content">
                  {metadata.campaign.title}
                </div>
              </div>
            )}

            {/* Game Edition */}
            {metadata.gameEdition && (
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">
                  Game Edition
                </div>
                <div className="text-sm text-base-content">
                  {metadata.gameEdition.name}
                  {metadata.gameEdition.version && ` (${metadata.gameEdition.version})`}
                </div>
              </div>
            )}

            {/* Created Date */}
            {metadata.createdAt && (
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">
                  Created
                </div>
                <div className="text-sm text-base-content">
                  {formatUIDate(metadata.createdAt)}
                </div>
              </div>
            )}

            {/* Updated Date */}
            {metadata.updatedAt && metadata.updatedAt !== metadata.createdAt && (
              <div>
                <div className="text-sm font-medium text-base-content/70 mb-1">
                  Last Updated
                </div>
                <div className="text-sm text-base-content">
                  {formatUIDate(metadata.updatedAt)}
                </div>
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