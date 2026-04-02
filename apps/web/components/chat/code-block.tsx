"use client";

import { useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeBlockProps {
  language: string;
  content: string;
  filename: string;
}

export function CodeBlock({ language, content, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-300 font-mono">
            {filename || language}
          </span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "13px",
          lineHeight: "1.6",
          padding: "16px",
          background: "#0d1117",
        }}
        showLineNumbers={content.split("\n").length > 5}
        lineNumberStyle={{
          color: "#4a5568",
          fontSize: "11px",
          minWidth: "2.5em",
        }}
      >
        {content.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
