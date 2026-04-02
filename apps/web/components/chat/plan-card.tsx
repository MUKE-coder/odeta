"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCircle, FileCode, ListChecks, Loader2, Package, Play, X, Zap } from "lucide-react";
import type { PlanItem } from "./message-parser";

const ITEM_COLORS: Record<string, { bg: string; text: string; badge: string; badgeBg: string }> = {
  scaffold: { bg: "bg-emerald-100", text: "text-emerald-700", badge: "SCAFFOLD", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  jb: { bg: "bg-blue-100", text: "text-blue-700", badge: "JB", badgeBg: "bg-blue-50 text-blue-700 border-blue-200" },
  code: { bg: "bg-purple-100", text: "text-purple-700", badge: "CODE", badgeBg: "bg-purple-50 text-purple-700 border-purple-200" },
};

interface PlanCardProps {
  title: string;
  items: PlanItem[];
  activeIndex?: number | null;
  completedIndexes?: number[];
  currentOutput?: string[];
}

export function PlanCard({
  title,
  items,
  activeIndex = null,
  completedIndexes = [],
  currentOutput = [],
}: PlanCardProps) {
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);

  // Auto-detect if build already started (from SSE events)
  const hasActivity = activeIndex !== null || completedIndexes.length > 0;
  useEffect(() => {
    if (hasActivity) setStarted(true);
  }, [hasActivity]);

  useEffect(() => {
    if (started || hasActivity) return;
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
  }, [started, hasActivity]);

  const doneCount = completedIndexes.length;
  const isComplete = doneCount === items.length && items.length > 0;
  const isBuilding = activeIndex !== null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        {isComplete ? (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Complete</span>
          </div>
        ) : isBuilding ? (
          <div className="flex items-center gap-1.5 text-accent">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs font-medium">Step {doneCount + 1} of {items.length}</span>
          </div>
        ) : !started ? (
          <span className="text-xs text-text-tertiary">Starting in {countdown}s...</span>
        ) : (
          <span className="text-xs text-text-tertiary">Starting...</span>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => {
          const status = completedIndexes.includes(i)
            ? "done"
            : activeIndex === i
              ? "running"
              : "pending";
          const colors = ITEM_COLORS[item.type] || ITEM_COLORS.code;

          return (
            <div
              key={i}
              className={cn(
                "transition-all duration-300",
                status === "running" && "bg-blue-50/40",
                status === "done" && "bg-gray-50/30"
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Status icon */}
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  {status === "running" && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                    </div>
                  )}
                  {status === "done" && (
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
                    </div>
                  )}
                  {status === "pending" && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-text-tertiary">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Type icon */}
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", colors.bg)}>
                  {item.type === "scaffold" && <Zap className={cn("w-3.5 h-3.5", colors.text)} />}
                  {item.type === "jb" && <Package className={cn("w-3.5 h-3.5", colors.text)} />}
                  {item.type === "code" && <FileCode className={cn("w-3.5 h-3.5", colors.text)} />}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate transition-colors",
                    status === "running" ? "text-blue-800" : status === "done" ? "text-text-tertiary" : "text-foreground"
                  )}>
                    {item.label}
                  </p>
                  {item.command && item.command !== "custom" && (
                    <p className="text-[11px] font-mono text-text-tertiary truncate mt-0.5">
                      {item.command.length > 55 ? item.command.slice(0, 55) + "..." : item.command}
                    </p>
                  )}
                </div>

                {/* Badge */}
                <span className={cn(
                  "flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                  colors.badgeBg,
                  status === "done" && "opacity-40"
                )}>
                  {colors.badge}
                </span>
              </div>

              {/* Live output for running item */}
              {status === "running" && currentOutput.length > 0 && (
                <div className="mx-4 mb-3 rounded-lg bg-gray-900 px-3 py-2 overflow-hidden">
                  {currentOutput.slice(-3).map((line, j) => (
                    <p key={j} className={cn(
                      "text-[11px] font-mono leading-5 truncate",
                      j === currentOutput.slice(-3).length - 1 ? "text-green-400" : "text-gray-500"
                    )}>
                      {line}
                    </p>
                  ))}
                  <span className="inline-block w-1.5 h-3 bg-green-400 animate-pulse rounded-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Manual start button */}
      {!started && !hasActivity && (
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
