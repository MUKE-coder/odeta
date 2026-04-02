"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Package } from "lucide-react";

interface JBCommandCardProps {
  url: string;
  component: string;
  description: string;
}

export function JBCommandCard({ url, component, description }: JBCommandCardProps) {
  const [copied, setCopied] = useState(false);
  const command = `pnpm dlx shadcn@latest add ${url}`;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-blue-200 bg-blue-100/60">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center flex-shrink-0">
          <Package className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-wider">
            JB Component
          </p>
          <p className="text-sm font-bold text-blue-800 truncate">{component}</p>
        </div>
        {url && (
          <a
            href={url.replace("/r/", "/").replace(".json", "")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {description && (
        <p className="px-4 py-2 text-xs text-blue-700">{description}</p>
      )}
      <div className="px-4 py-2.5 bg-[#0d1117] flex items-center justify-between gap-3">
        <code className="text-xs font-mono text-gray-300 truncate flex-1">
          <span className="text-red-400">pnpm</span>
          <span className="text-gray-400"> dlx shadcn@latest add </span>
          <span className="text-blue-300 text-[11px]">{url}</span>
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
