"use client";

import React, { useMemo } from "react";
import MarkdownRenderer from "./markdown-renderer";

interface PromotionAnnotation {
  type: string;
  id: number;
  text: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
}

interface HighlightedMarkdownRendererProps {
  content?: string | null;
  className?: string;
  allowHtml?: boolean;
  promotions?: PromotionAnnotation[];
  onHighlightClick?: (promotion: PromotionAnnotation) => void;
  onHighlightHover?: (promotion: PromotionAnnotation | null) => void;
}

export default function HighlightedMarkdownRenderer({
  content,
  className,
  allowHtml = true,
  promotions = [],
  onHighlightClick,
  onHighlightHover,
}: HighlightedMarkdownRendererProps) {
  // Process content with highlights injected
  const processedContent = useMemo(() => {
    if (!content || !promotions.length) {
      return content;
    }

    // Sort promotions by startOffset to process them in order
    const sortedPromotions = [...promotions].sort((a, b) => a.startOffset - b.startOffset);

    let result = content;
    let offsetAdjustment = 0;

    for (const promotion of sortedPromotions) {
      const { startOffset, endOffset, type, id, text } = promotion;

      // Adjust offsets for previous insertions
      const adjustedStart = startOffset + offsetAdjustment;
      const adjustedEnd = endOffset + offsetAdjustment;

      // Create highlight wrapper
      const entityType = type.replace('_', '-');
      const highlightClass = `promotion-highlight promotion-${entityType}`;
      const dataAttributes = `data-entity-type="${type}" data-entity-id="${id}" data-promotion-text="${text.replace(/"/g, '&quot;')}"`;

      const beforeText = result.substring(0, adjustedStart);
      const highlightedText = result.substring(adjustedStart, adjustedEnd);
      const afterText = result.substring(adjustedEnd);

      // Wrap the highlighted text with a span that includes data attributes
      const highlightedHtml = `<span class="${highlightClass}" ${dataAttributes} style="background-color: rgba(59, 130, 246, 0.1); border-bottom: 2px solid rgb(59, 130, 246); padding: 2px 0; border-radius: 2px; cursor: pointer; transition: all 0.2s ease;">${highlightedText}</span>`;

      result = beforeText + highlightedHtml + afterText;

      // Update offset adjustment for next promotion
      offsetAdjustment += highlightedHtml.length - highlightedText.length;
    }

    return result;
  }, [content, promotions]);

  return (
    <div
      className="relative"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('promotion-highlight') && onHighlightClick) {
          const promotion: PromotionAnnotation = {
            type: target.dataset.entityType!,
            id: parseInt(target.dataset.entityId!),
            text: target.dataset.promotionText!,
            startOffset: 0, // Not needed for click handler
            endOffset: 0,
            createdAt: '', // Not needed for click handler
          };
          onHighlightClick(promotion);
        }
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('promotion-highlight') && onHighlightHover) {
          const promotion: PromotionAnnotation = {
            type: target.dataset.entityType!,
            id: parseInt(target.dataset.entityId!),
            text: target.dataset.promotionText!,
            startOffset: 0,
            endOffset: 0,
            createdAt: '',
          };
          onHighlightHover(promotion);
        }
      }}
      onMouseLeave={() => {
        if (onHighlightHover) {
          onHighlightHover(null);
        }
      }}
    >
      <MarkdownRenderer
        content={processedContent}
        className={className}
        allowHtml={allowHtml}
      />
    </div>
  );
}
