"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  className = ""
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`transition-all duration-300 ease-in-out ${className}`}>
      <CardHeader
        className="cursor-pointer hover:bg-base-200/50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <Button variant="ghost" size="sm" className="p-1">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform duration-200" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="pt-4">
          {children}
        </CardContent>
      </div>
    </Card>
  );
}
