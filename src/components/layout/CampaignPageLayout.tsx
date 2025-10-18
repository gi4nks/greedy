import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { CampaignWithEdition } from "@/lib/utils/campaign";

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
  children,
}: CampaignPageLayoutProps) {
  return (
    <div className="container mx-auto p-6">
      <DynamicBreadcrumb
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        sectionItems={sectionItems}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-base-content/70 mt-2">{description}</p>
        </div>
        {createButton && (
          <Link href={createButton.href}>
            <Button className="gap-2" variant="primary" size="sm">
              {createButton.icon}
              {createButton.label}
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
