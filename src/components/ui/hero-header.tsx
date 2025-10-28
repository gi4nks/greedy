"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface HeroHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "outline";
    className?: string;
  }>;
  actions?: ReactNode;
  className?: string;
}

export function HeroHeader({
  icon,
  title,
  subtitle,
  badges,
  actions,
  className = ""
}: HeroHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 bg-gradient-to-r from-base-200/50 to-base-100 rounded-lg border border-base-200 ${className}`}>
      {/* Left side - Icon + Title + Subtitle + Badges */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0">
            <div className="p-3 bg-primary/10 rounded-lg">
              {icon}
            </div>
          </div>
        )}

        {/* Title + Subtitle + Badges */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-base-content truncate">{title}</h2>
          {subtitle && (
            <p className="text-base-content/70 mt-1 truncate">{subtitle}</p>
          )}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || "outline"}
                  className={badge.className}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      {actions && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}