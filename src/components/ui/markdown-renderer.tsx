import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "highlight.js/styles/github.css";

import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
  allowHtml?: boolean;
}

export const markdownComponents: Components = {
  img: (props) => (
    <img
      {...props}
      alt={props.alt || ""}
      className={cn(
        "max-w-full h-auto rounded-lg shadow-sm",
        (props as { className?: string }).className,
      )}
      loading={props.loading ?? "lazy"}
    />
  ),
  a: (props) => {
    const isExternal =
      typeof props.href === "string" && /^https?:\/\//.test(props.href);
    return (
      <a
        {...props}
        className={cn(
          "text-primary underline decoration-primary/50 transition-colors hover:decoration-primary",
          (props as { className?: string }).className,
        )}
        target={isExternal ? "_blank" : props.target}
        rel={isExternal ? "noopener noreferrer" : props.rel}
      />
    );
  },
  table: (props) => (
    <table
      {...props}
      className={cn(
        "table-auto border-collapse overflow-hidden rounded-lg",
        (props as { className?: string }).className,
      )}
    />
  ),
  th: (props) => (
    <th
      {...props}
      className={cn(
        "bg-base-200 px-3 py-2 text-left font-semibold",
        (props as { className?: string }).className,
      )}
    />
  ),
  td: (props) => (
    <td
      {...props}
      className={cn(
        "border-t border-base-300 px-3 py-2 align-top",
        (props as { className?: string }).className,
      )}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !!(props as { inline?: boolean }).inline;
    const codeProps = { ...props };
    delete (codeProps as { inline?: boolean }).inline;

    return (
      <code
        className={cn(
          isInline
            ? "rounded bg-base-200 px-1 py-0.5 text-[0.85em]"
            : "block overflow-x-auto rounded-lg bg-base-200/70 p-4 text-sm",
          className,
        )}
        {...codeProps}
      >
        {children}
      </code>
    );
  },
};

const htmlSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      ["href"],
      ["target"],
      ["rel"],
      ["data-wiki-link"],
      ["className"],
    ],
    span: [...(defaultSchema.attributes?.span || []), ["className"]],
    div: [...(defaultSchema.attributes?.div || []), ["className"]],
    p: [...(defaultSchema.attributes?.p || []), ["className"]],
    h1: [["className"]],
    h2: [["className"]],
    h3: [["className"]],
    h4: [["className"]],
    h5: [["className"]],
    h6: [["className"]],
    table: [...(defaultSchema.attributes?.table || []), ["className"]],
    thead: [["className"]],
    tbody: [["className"]],
    tr: [["className"]],
    th: [["className"]],
    td: [["className"]],
    ul: [["className"]],
    ol: [["className"]],
    li: [["className"]],
    hr: [["className"]],
    pre: [...(defaultSchema.attributes?.pre || []), ["className"]],
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
    img: [
      ...(defaultSchema.attributes?.img || []),
      ["className"],
      ["loading"],
      ["src"],
      ["alt"],
    ],
    dt: [["className"]],
    dd: [["className"]],
  },
} as const;

export default function MarkdownRenderer({
  content,
  className,
  allowHtml = false,
}: MarkdownRendererProps) {
  if (!content || typeof content !== "string") {
    return null;
  }

  return (
    <div className={cn("prose max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={
          allowHtml
            ? [rehypeRaw, [rehypeSanitize, htmlSanitizeSchema], rehypeHighlight]
            : [rehypeHighlight]
        }
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
