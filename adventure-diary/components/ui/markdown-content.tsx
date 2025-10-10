'use client';

import { marked } from 'marked';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <div
        dangerouslySetInnerHTML={{
          __html: marked(content, {
            breaks: true,
            gfm: true
          })
        }}
      />
    </div>
  );
}