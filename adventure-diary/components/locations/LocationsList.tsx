"use client";

import Link from 'next/link';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Mountain, Trees } from 'lucide-react';
import { deleteLocationAction } from '@/lib/actions/locations';

interface LocationsListProps {
  locations: any[];
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
          <Button size="sm">
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
        // Parse images for display
        let images: any[] = [];
        try {
          images = typeof location.images === 'string' && location.images.trim()
            ? JSON.parse(location.images)
            : location.images || [];
        } catch {
          images = [];
        }

        const getLocationIcon = (type: string) => {
          switch (type?.toLowerCase()) {
            case 'city': return <Building className="w-5 h-5 text-blue-500" />;
            case 'dungeon': return <Mountain className="w-5 h-5 text-base-content/60" />;
            case 'forest': return <Trees className="w-5 h-5 text-green-500" />;
            default: return <MapPin className="w-5 h-5 text-orange-500" />;
          }
        };

        const getLocationTypeColor = (type: string) => {
          switch (type?.toLowerCase()) {
            case 'city': return 'default';
            case 'dungeon': return 'secondary';
            case 'forest': return 'outline';
            case 'village': return 'outline';
            default: return 'outline';
          }
        };

        return (
          <Card key={location.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    {getLocationIcon(location.locationType)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {location.locationType && (
                        <Badge variant={getLocationTypeColor(location.locationType)}>
                          {location.locationType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {location.description && (
                <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
                  {location.description}
                </p>
              )}

              {location.notes && (
                <p className="text-xs text-base-content/70 mb-3 line-clamp-2 italic">
                  Notes: {location.notes}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Link href={`/campaigns/${campaignId}/locations/${location.id}`}>
                  <Button variant="info" size="sm">
                    View
                  </Button>
                </Link>
                <Link href={`/campaigns/${campaignId}/locations/${location.id}/edit`}>
                  <Button variant="primary" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleDelete(location.id)}
                  disabled={isPending}
                >
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