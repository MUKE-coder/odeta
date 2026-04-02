"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCircle, Copy, Loader2, Terminal, XCircle } from "lucide-react";

interface CommandCardProps {
  content: string;
  label: string;
  status?: "idle" | "running" | "done" | "failed";
  output?: string[];
  error?: string;
}

export function CommandCard({
  content,
  label,
  status = "idle",
  output = [],
  error,
}: CommandCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gray-900">
        <div className="flex items-center gap-2">
          {status === "running" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
          {status === "done" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
          {status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
          {status === "idle" && <Terminal className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-xs text-gray-300 font-medium">{label}</span>
          {status === "running" && (
            <span className="text-[10px] text-blue-400 animate-pulse">Running...</span>
          )}
          {status === "done" && (
            <span className="text-[10px] text-green-400">Done</span>
          )}
          {status === "failed" && (
            <span className="text-[10px] text-red-400">Failed</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Command */}
      <div className="bg-[#0d1117] px-4 py-2.5">
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

      {/* Live output */}
      {(status === "running" || status === "failed") && output.length > 0 && (
        <div className="bg-[#0d1117] border-t border-gray-800 px-4 py-2 max-h-40 overflow-y-auto">
          {output.slice(-20).map((line, i) => (
            <div
              key={i}
              className={cn(
                "text-[11px] font-mono leading-5",
                line.startsWith("[err]") ? "text-red-400" : "text-gray-400"
              )}
            >
              {line.replace("[err] ", "")}
            </div>
          ))}
          {status === "running" && (
            <span className="inline-block w-2 h-3 bg-gray-400 animate-pulse rounded-sm mt-1" />
          )}
        </div>
      )}

      {/* Error message */}
      {status === "failed" && error && (
        <div className="bg-red-950/30 border-t border-red-900 px-4 py-2">
          <p className="text-xs text-red-400 font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}
