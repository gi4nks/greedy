import Link from "next/link";
import { Campaign } from "@/lib/db/schema";
import { Card, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
        <CardContent>
          <CardTitle>{campaign.title}</CardTitle>
          {campaign.description && (
            <div className="text-sm text-base-content/70 mb-2 max-h-16 overflow-hidden">
              <MarkdownRenderer
                content={campaign.description}
                className="prose-sm text-base-content/70"
              />
            </div>
          )}
          <CardFooter>
            <Badge variant="outline">{campaign.status || "active"}</Badge>
          </CardFooter>
        </CardContent>
      </Card>
    </Link>
  );
}
