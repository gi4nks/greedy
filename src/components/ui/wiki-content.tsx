"use client";

import DOMPurify from "dompurify";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { isHTML, detectContentFormat } from "@/lib/utils/content-format";

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
  // AD&D 2e wiki articles - always render as HTML (wikitext converted to HTML)
  if (importedFrom === "adnd2e-wiki") {
    return (
      <div
        className={`prose max-w-none dark:prose-invert ${className}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || ""),
        }}
      />
    );
  }

  // Open5e API imports - detect format dynamically
  if (importedFrom === "open5e-api") {
    const contentFormat = detectContentFormat(content);

    if (contentFormat === "html") {
      return (
        <div
          className={`prose max-w-none dark:prose-invert ${className}`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(content || ""),
          }}
        />
      );
    }

    // Even for non-HTML Open5e content, use markdown renderer
    // to handle any formatting that might be present
    return (
      <MarkdownRenderer content={content || ""} className={className} />
    );
  }

  // Legacy 5e.tools imports or unknown sources - try to detect format
  const contentFormat = detectContentFormat(content);

  if (contentFormat === "html" || isHTML(content)) {
    return (
      <div
        className={`prose max-w-none dark:prose-invert ${className}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || ""),
        }}
      />
    );
  }

  // Default to markdown rendering
  return <MarkdownRenderer content={content || ""} className={className} />;
}