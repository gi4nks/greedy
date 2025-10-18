"use client";

import DOMPurify from "dompurify";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface WikiContentProps {
  content: string;
  importedFrom?: string | null;
  className?: string;
}

export default function WikiContent({
  content,
  importedFrom,
  className = "prose-sm",
}: WikiContentProps) {
  if (importedFrom === "adnd2e-wiki") {
    return (
      <div
        className={`prose max-w-none ${className}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || ""),
        }}
      />
    );
  }

  return <MarkdownRenderer content={content || ""} className={className} />;
}