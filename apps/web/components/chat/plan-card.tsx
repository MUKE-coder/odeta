"use client";

import { useEffect, useState } from "react";
import { Zap, Package, FileCode, ListChecks, Loader2, Play } from "lucide-react";
import type { PlanItem } from "./message-parser";

const ITEM_CONFIG: Record<string, { icon: typeof Zap; bg: string; border: string; text: string; badge: string }> = {
  scaffold: { icon: Zap, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "scaffold" },
  jb: { icon: Package, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "JB" },
  code: { icon: FileCode, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "code" },
};

interface PlanCardProps {
  title: string;
  items: PlanItem[];
}

export function PlanCard({ title, items }: PlanCardProps) {
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        {!started && countdown > 0 && (
          <span className="text-xs text-gray-400">Starting in {countdown}s...</span>
        )}
        {started && (
          <span className="text-xs text-accent flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Building...
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => {
          const config = ITEM_CONFIG[item.type] || ITEM_CONFIG.code;
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-[10px] text-text-secondary font-medium flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className={`flex-shrink-0 w-6 h-6 rounded-md ${config.bg} border ${config.border} flex items-center justify-center mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${config.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{item.label}</p>
                {item.command && (
                  <code className="text-[11px] text-text-tertiary font-mono mt-0.5 block truncate">
                    {item.command}
                  </code>
                )}
              </div>
              <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.bg} ${config.text} border ${config.border}`}>
                {config.badge}
              </span>
            </div>
          );
        })}
      </div>

      {/* Manual start button */}
      {!started && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setStarted(true)}
            className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            Start now
          </button>
        </div>
      )}
    </div>
  );
}
