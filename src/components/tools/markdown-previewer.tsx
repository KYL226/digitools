"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useI18n } from "@/lib/i18n/i18n-context";
import { CopyButton } from "@/components/tool/copy-button";
import { DownloadButton } from "@/components/tool/download-button";
import { ResetButton } from "@/components/tool/action-buttons";
import { EmptyState } from "@/components/tool/states";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  List,
  Quote,
  FileText,
  Eye,
} from "lucide-react";

interface QuickInsert {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  insert: string;
  /** Cursor offset (chars from end of inserted text) */
  cursorOffset?: number;
}

const QUICK_INSERTS: QuickInsert[] = [
  { id: "h1", icon: Heading1, label: "H1", insert: "# " },
  { id: "h2", icon: Heading2, label: "H2", insert: "## " },
  {
    id: "bold",
    icon: Bold,
    label: "Bold",
    insert: "**bold**",
    cursorOffset: -5,
  },
  {
    id: "italic",
    icon: Italic,
    label: "Italic",
    insert: "_italic_",
    cursorOffset: -2,
  },
  {
    id: "link",
    icon: LinkIcon,
    label: "Link",
    insert: "[text](https://)",
    cursorOffset: -1,
  },
  {
    id: "code",
    icon: Code,
    label: "Code",
    insert: "`code`",
    cursorOffset: -1,
  },
  {
    id: "list",
    icon: List,
    label: "List",
    insert: "- ",
  },
  { id: "quote", icon: Quote, label: "Quote", insert: "> " },
];

/**
 * react-markdown component overrides. We style rendered output with Tailwind
 * classes — no `dangerouslySetInnerHTML` is used. By default react-markdown
 * escapes/disallows raw HTML so this is XSS-safe.
 */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-3 mt-4">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3 mt-5 border-b border-border pb-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2 mt-4">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2 mt-3">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="scroll-m-20 text-base font-semibold tracking-tight mb-1.5 mt-3">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="scroll-m-20 text-sm font-semibold tracking-tight mb-1.5 mt-3">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed mb-3 [&:not(:first-child)]:mt-3">
      {children}
    </p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-muted-foreground">{children}</del>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-sm mb-3 space-y-1 pl-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-sm mb-3 space-y-1 pl-2">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-3 my-3 italic text-muted-foreground text-sm">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-t border-border" />,
  // react-markdown v10 wraps code blocks in `pre > code`
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/60 p-3 my-3 text-xs">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    // Inline code vs block code: react-markdown tags block code with `language-*`
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={`font-mono ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/60">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-border px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-1.5 align-top">
      {children}
    </td>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
};

export function MarkdownPreviewer() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [htmlString, setHtmlString] = useState("");

  // After every render where `input` changes, read the live innerHTML from
  // the preview div. react-markdown renders synchronously, so by the time
  // the setTimeout fires the DOM reflects the latest input. The setState
  // is invoked inside the timer callback (NOT in the effect body) to
  // satisfy the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!input.trim()) {
        setHtmlString("");
        return;
      }
      if (previewRef.current) {
        setHtmlString(previewRef.current.innerHTML);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [input]);

  const insertAtCursor = useCallback(
    (text: string, cursorOffset = 0) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = input.slice(0, start) + text + input.slice(end);
      setInput(next);
      // Place cursor: end-of-insert minus cursorOffset
      requestAnimationFrame(() => {
        const target = start + text.length - (cursorOffset < 0 ? Math.abs(cursorOffset) : 0);
        ta.focus();
        ta.setSelectionRange(target, target);
      });
    },
    [input]
  );

  const handleQuickInsert = useCallback(
    (qi: QuickInsert) => {
      insertAtCursor(qi.insert, qi.cursorOffset ?? 0);
    },
    [insertAtCursor]
  );

  const reset = useCallback(() => {
    setInput("");
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          {QUICK_INSERTS.map((qi) => {
            const Icon = qi.icon;
            return (
              <Tooltip key={qi.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickInsert(qi)}
                    className="gap-1.5"
                    aria-label={qi.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{qi.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{qi.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input column */}
        <div className="space-y-2">
          <Label
            htmlFor="md-input"
            className="text-xs text-muted-foreground flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            {t("tools.markdown-previewer.input")}
          </Label>
          <Textarea
            id="md-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.markdown-previewer.inputPlaceholder")}
            className="font-mono text-sm min-h-[400px] resize-y"
            spellCheck={false}
            aria-label={t("tools.markdown-previewer.input")}
          />
        </div>

        {/* Preview column */}
        <div className="space-y-2">
          <Label
            htmlFor="md-preview"
            className="text-xs text-muted-foreground flex items-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("tools.markdown-previewer.preview")}
          </Label>
          {input.trim() ? (
            <div
              ref={previewRef}
              id="md-preview"
              className="min-h-[400px] overflow-y-auto rounded-md border border-border bg-background p-4 prose-sm max-w-none"
              aria-label={t("tools.markdown-previewer.preview")}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {input}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
              <EmptyState />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CopyButton
          value={htmlString}
          disabled={!input.trim()}
          label={t("common.copy") + " HTML"}
        />
        <DownloadButton
          data={(() => {
            const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Markdown Export</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
${htmlString}
</body>
</html>`;
            return new Blob([doc], { type: "text/html" });
          })()}
          filename="markdown-export.html"
          mime="text/html"
          disabled={!input.trim()}
          label={"HTML"}
        />
        <DownloadButton
          data={input}
          filename="markdown-source.md"
          mime="text/markdown"
          disabled={!input.trim()}
          label={"MD"}
        />
        <ResetButton onClick={reset} variant="ghost" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("common.privacyNote")}
      </p>
    </div>
  );
}
