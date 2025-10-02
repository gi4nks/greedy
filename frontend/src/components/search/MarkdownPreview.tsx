import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  label?: string;
  height?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = React.memo(({
  content,
  label = "Preview",
  height = "h-40"
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-base-content mb-2">{label}</label>
      <div className={`bg-base-200 border border-base-300 rounded-box p-4 ${height} overflow-auto`}>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
});