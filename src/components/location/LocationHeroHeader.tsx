"use client";

import Link from "next/link";
import { MapPin, Building, Mountain, Trees, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/ui/hero-header";

interface LocationHeroHeaderProps {
  location: {
    id: number;
    name: string;
    description: string | null;
    tags: unknown;
  };
  campaignId: number;
}

export function LocationHeroHeader({ location, campaignId }: LocationHeroHeaderProps) {
  // Parse tags
  let tags: string[] = [];
  try {
    tags = typeof location.tags === "string" ? JSON.parse(location.tags) : location.tags || [];
  } catch {
    tags = [];
  }

  // Determine location icon based on tags or name
  const getLocationIcon = () => {
    const name = location.name?.toLowerCase() || "";
    const locationTags = tags.map((t) => t.toLowerCase());

    if (
      locationTags.includes("city") ||
      locationTags.includes("town") ||
      name.includes("city") ||
      name.includes("town")
    ) {
      return Building;
    }
    if (
      locationTags.includes("mountain") ||
      locationTags.includes("peak") ||
      name.includes("mountain") ||
      name.includes("peak")
    ) {
      return Mountain;
    }
    if (
      locationTags.includes("forest") ||
      locationTags.includes("woods") ||
      name.includes("forest") ||
      name.includes("woods")
    ) {
      return Trees;
    }
    return MapPin;
  };

  const LocationIcon = getLocationIcon();

  const badges = tags.map(tag => ({
    label: tag,
    variant: "secondary" as const
  }));

  const actions = (
    <Link href={`/campaigns/${campaignId}/locations/${location.id}/edit`}>
      <Button variant="secondary" size="sm" className="gap-2">
        <Edit className="w-4 h-4" />
        Edit
      </Button>
    </Link>
  );

  return (
    <HeroHeader
      icon={<LocationIcon className="w-8 h-8 text-primary" />}
      title={location.name}
      subtitle={location.description || undefined}
      badges={badges}
      actions={actions}
    />
  );
}