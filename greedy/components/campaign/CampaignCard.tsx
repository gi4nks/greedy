import Link from 'next/link';
import { Campaign } from '@/lib/db/schema';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
        <div className="card-body">
          <h2 className="card-title">{campaign.title}</h2>
          {campaign.description && (
            <div className="text-sm text-base-content/70 mb-2 max-h-16 overflow-hidden">
              <MarkdownRenderer
                content={campaign.description}
                className="prose-sm text-base-content/70"
              />
            </div>
          )}
          <div className="card-actions justify-end">
            <div className="badge badge-outline">
              {campaign.status || 'active'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}