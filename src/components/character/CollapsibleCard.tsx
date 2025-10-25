"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sword, Book, User, Heart, Zap, Shield } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

const iconMap = {
  sword: Sword,
  book: Book,
  user: User,
  heart: Heart,
  zap: Zap,
  shield: Shield,
};

export default function CollapsibleCard({
  title,
  icon,
  children,
  defaultExpanded = false,
  className = ""
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const IconComponent = icon ? iconMap[icon as keyof typeof iconMap] : null;

  return (
    <Card className={`transition-all duration-200 ${className}`}>
      <CardHeader
        className="cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span>{title}</span>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}