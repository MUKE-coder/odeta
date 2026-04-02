"use client";

import { Zap, Package, FileCode, ListChecks } from "lucide-react";
import type { PlanItem } from "./message-parser";

const ITEM_CONFIG = {
  grit: { icon: Zap, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "grit" },
  jb: { icon: Package, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "JB" },
  code: { icon: FileCode, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "code" },
};

interface PlanCardProps {
  title: string;
  items: PlanItem[];
}

export function PlanCard({ title, items }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
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
    </div>
  );
}
