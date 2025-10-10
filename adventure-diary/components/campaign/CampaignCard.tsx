import Link from 'next/link';
import { Campaign } from '@/lib/db/schema';

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
            <p className="text-sm text-base-content/70 line-clamp-2">
              {campaign.description}
            </p>
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