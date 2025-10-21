/**
 * Utility functions for detecting and handling different content formats
 * (HTML, Markdown, plaintext)
 */

/**
 * Detects if a string contains HTML markup
 * @param content The content string to check
 * @returns true if the content appears to be HTML
 */
export function isHTML(content: string | null | undefined): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  // Check for common HTML tags
  // This regex looks for opening or closing HTML tags
  const htmlRegex = /<\/?[a-z][\s\S]*?>/i;
  return htmlRegex.test(content.trim());
}

/**
 * Detects if a string contains Markdown formatting
 * @param content The content string to check
 * @returns true if the content appears to be Markdown
 */
export function isMarkdown(content: string | null | undefined): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  // Check for common Markdown syntax
  const markdownRegex = /([*_`#\[\-])|(\n\s*[-*+])|(\n\s*\d+\.)/;
  return markdownRegex.test(content);
}

/**
 * Detects the likely format of content
 * @param content The content string to analyze
 * @returns 'html' | 'markdown' | 'plaintext'
 */
export function detectContentFormat(
  content: string | null | undefined,
): "html" | "markdown" | "plaintext" {
  if (!content || typeof content !== "string") {
    return "plaintext";
  }

  if (isHTML(content)) {
    return "html";
  }

  if (isMarkdown(content)) {
    return "markdown";
  }

  return "plaintext";
}
