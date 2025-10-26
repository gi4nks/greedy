import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { CampaignWithEdition } from "@/lib/utils/campaign";
import { PageContainer } from "./PageContainer";
import { PageHeader } from "./PageHeader";

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
    <PageContainer>
      <DynamicBreadcrumb
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        sectionItems={sectionItems}
      />

      <PageHeader
        title={title}
        description={description}
        actions={
          createButton && (
            <Link href={createButton.href}>
              <Button className="gap-2" variant="primary" size="sm">
                {createButton.icon}
                {createButton.label}
              </Button>
            </Link>
          )
        }
      />

      <div className="space-y-4">{children}</div>
    </PageContainer>
  );
}
