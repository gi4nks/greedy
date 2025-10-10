import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { CampaignWithEdition } from '@/lib/utils/campaign';

interface CampaignPageLayoutProps {
  campaign: CampaignWithEdition;
  title: string;
  description: string;
  sectionItems?: Array<{ label: string; href?: string }>;
  createButton?: {
    href: string;
    label: string;
    icon?: ReactNode;
  };
  children: ReactNode;
}

export function CampaignPageLayout({
  campaign,
  title,
  description,
  sectionItems = [],
  createButton,
  children
}: CampaignPageLayoutProps) {
  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        sectionItems={sectionItems}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-base-content/70">
              {campaign.title} • {description}
            </p>
          </div>
          {createButton && (
            <Link href={createButton.href}>
              <Button size="sm" className="gap-2">
                {createButton.icon}
                {createButton.label}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}