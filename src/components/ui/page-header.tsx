"use client";

import { ReactNode } from "react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface PageHeaderProps {
  breadcrumb?: {
    campaignId?: number;
    campaignTitle?: string;
    sectionItems?: Array<{ label: string; href?: string }>;
    items?: Array<{ label: string; href?: string }>;
  };
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <DynamicBreadcrumb
          campaignId={breadcrumb.campaignId}
          campaignTitle={breadcrumb.campaignTitle}
          sectionItems={breadcrumb.sectionItems}
          items={breadcrumb.items}
        />
      )}

      {/* Title + Actions Row */}
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title && (
              <h1 className="text-3xl font-bold text-base-content">{title}</h1>
            )}
            {subtitle && (
              <p className="text-base-content/70 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}