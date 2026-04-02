"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CommandCardProps {
  content: string;
  label: string;
}

export function CommandCard({ content, label }: CommandCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-gray-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="bg-[#0d1117] px-4 py-3">
        <code className="text-sm font-mono leading-relaxed">
          <span className="text-gray-500">$ </span>
          {content.startsWith("pnpm ") ? (
            <>
              <span className="text-red-400">pnpm</span>
              <span className="text-gray-200"> {content.slice(5)}</span>
            </>
          ) : (
            <span className="text-gray-200">{content}</span>
          )}
        </code>
      </div>
    </div>
  );
}
