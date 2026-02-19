"use client";

import { useState, useCallback } from "react";
import { Highlight } from "prism-react-renderer";
import { codeTheme } from "@/styles/code-theme";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="flex h-full flex-col rounded-md border border-[var(--border)] bg-[#0d1117]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Highlight theme={codeTheme} code={code.trim()} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{ ...style, margin: 0, padding: "16px" }}
              className="text-sm leading-relaxed"
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="whitespace-pre">
                  <span className="mr-4 inline-block w-8 select-none text-right text-[var(--muted-foreground)] opacity-50">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
