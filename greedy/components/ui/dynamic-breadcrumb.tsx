'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DynamicBreadcrumbProps {
  // For top-level pages (campaigns list, etc.)
  items?: BreadcrumbItem[];
  // For campaign-scoped pages
  campaignId?: number;
  campaignTitle?: string;
  // Additional items to append after campaign
  sectionItems?: BreadcrumbItem[];
}

export default function DynamicBreadcrumb({
  items,
  campaignId,
  campaignTitle,
  sectionItems = []
}: DynamicBreadcrumbProps) {
  // If we have campaign context, use the campaign-aware breadcrumb
  if (campaignId !== undefined) {
    return (
      <nav className="flex items-center space-x-2 text-sm text-base-content/70 mb-6">
        {/* Home */}
        <Link href="/" className="flex items-center hover:text-base-content transition-colors">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Home className="w-4 h-4" />
          </Button>
        </Link>

        <ChevronRight className="w-4 h-4 flex-shrink-0" />

        {/* Campaigns */}
        <Link
          href="/campaigns"
          className="hover:text-base-content transition-colors flex items-center min-h-6"
        >
          Campaigns
        </Link>

        <ChevronRight className="w-4 h-4 flex-shrink-0" />

        {/* Campaign */}
        <Link
          href={`/campaigns/${campaignId}`}
          className="hover:text-base-content transition-colors flex items-center min-h-6"
        >
          {campaignTitle || `Campaign ${campaignId}`}
        </Link>

        {/* Additional section items */}
        {sectionItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-base-content transition-colors flex items-center min-h-6"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-base-content flex items-center min-h-6">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // For top-level pages without campaign context
  return (
    <nav className="flex items-center space-x-2 text-sm text-base-content/70 mb-6">
      {/* Home */}
      <Link href="/" className="flex items-center hover:text-base-content transition-colors">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Home className="w-4 h-4" />
        </Button>
      </Link>

      {/* Items */}
      {items?.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-base-content transition-colors flex items-center min-h-6"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-base-content flex items-center min-h-6">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}