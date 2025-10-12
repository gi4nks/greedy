"use client";

import Link from 'next/link';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, Trash2, View } from 'lucide-react';
import { deleteLocationAction } from '@/lib/actions/locations';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

type Location = {
  id: number;
  campaignId: number | null;
  adventureId: number | null;
  name: string;
  description: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

interface LocationsListProps {
  locations: Location[];
  campaignId: number;
}

export function LocationsList({ locations, campaignId }: LocationsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (locationId: number) => {
    if (confirm('Are you sure you want to delete this location?')) {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('id', locationId.toString());
          formData.append('campaignId', campaignId.toString());
          await deleteLocationAction(formData);
        } catch (error) {
          console.error('Failed to delete location:', error);
          alert('Failed to delete location');
        }
      });
    }
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <MapPin className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No locations yet</h3>
          <p className="text-base-content/70 mb-4">
            Create your first location to start mapping your campaign world.
          </p>
        </div>
  <Link href={`/campaigns/${campaignId}/locations/create`}>
          <Button size="sm" variant="primary">
            <MapPin className="w-4 h-4 mr-2" />
            Create First Location
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map((location) => {
        const getLocationIcon = () => {
          return <MapPin className="w-5 h-5 text-orange-500" />;
        };

        const getLocationTypeColor = (): "default" | "secondary" | "outline" => {
          return 'outline';
        };

        return (
          <Card key={location.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    {getLocationIcon()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getLocationTypeColor()}>
                        Location
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {location.description && (
                <div className="text-sm text-base-content/70 mb-3 max-h-24 overflow-hidden">
                  <MarkdownRenderer
                    content={location.description}
                    className="prose-sm text-base-content/70"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Link href={`/campaigns/${campaignId}/locations/${location.id}`}>
                  <Button size="sm" variant="warning" className="gap-2">
                    <View className="w-4 h-4" />
                    View
                  </Button>
                </Link>
                <Link href={`/campaigns/${campaignId}/locations/${location.id}/edit`}>
                  <Button variant="secondary" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="neutral"
                  className="gap-2"
                  size="sm"
                  onClick={() => handleDelete(location.id)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}