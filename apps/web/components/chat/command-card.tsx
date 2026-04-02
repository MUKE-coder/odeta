"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CommandCardProps {
  command: string;
  type: "command" | "jb-command";
}

export function CommandCard({ command, type }: CommandCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg bg-gray-900 text-gray-100 p-3 font-mono text-xs">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Terminal className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-wider">
            {type === "jb-command" ? "JB Component" : "Terminal"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <code className="text-green-400">$ {command}</code>
    </div>
  );
}
