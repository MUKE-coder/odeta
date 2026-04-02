"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGES = [
  "Setting up your Next.js project...",
  "Configuring TypeScript and Tailwind...",
  "Installing dependencies...",
  "Installing shadcn/ui components...",
  "Adding UI building blocks...",
  "Generating your pages and routes...",
  "Building your dashboard layout...",
  "Writing your data models...",
  "Creating API route handlers...",
  "Applying your chosen design...",
  "Connecting your components...",
];

interface BuildPreviewProps {
  currentStep?: string;
  progressPercent?: number;
  recentFiles?: string[];
}

export function BuildPreview({
  currentStep,
  progressPercent = 0,
  recentFiles = [],
}: BuildPreviewProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
      {/* Animated fake app skeleton */}
      <div className="flex-1 overflow-hidden">
        {/* Fake navbar */}
        <div className="h-14 border-b border-gray-100 flex items-center px-6 gap-4">
          <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
          <div className="w-28 h-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        </div>

        <div className="flex h-[calc(100%-56px)]">
          {/* Fake sidebar */}
          <div className="w-48 border-r border-gray-100 p-4 flex-shrink-0 space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-4" />
            {[85, 70, 90, 60, 75].map((w, i) => (
              <div
                key={i}
                className={cn("h-8 rounded-lg animate-pulse", i === 0 ? "bg-blue-100" : "bg-gray-100")}
                style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Fake main content */}
          <div className="flex-1 p-6 space-y-5 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-5 bg-gray-300 rounded animate-pulse w-40" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-56" />
              </div>
              <div className="h-9 w-28 bg-blue-200 rounded-lg animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                  <div className="h-7 bg-gray-300 rounded animate-pulse w-20" />
                </div>
              ))}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                {[120, 160, 100, 80].map((w, i) => (
                  <div key={i} className="h-3 bg-gray-300 rounded animate-pulse" style={{ width: w }} />
                ))}
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  {[100, 140, 80].map((w, i) => (
                    <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-8 pb-6 px-6">
        {currentStep && (
          <div className="flex items-center gap-2 justify-center mb-2">
            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin flex-shrink-0" />
            <p className="text-xs font-semibold text-accent truncate">{currentStep}</p>
          </div>
        )}

        <p key={msgIdx} className="text-xs text-text-tertiary text-center animate-pulse">
          {MESSAGES[msgIdx]}
        </p>

        {recentFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {recentFiles.slice(-4).map((file, i) => (
              <span key={file + i} className="text-[10px] font-mono bg-gray-100 text-text-tertiary px-2 py-0.5 rounded-full">
                {file.split("/").pop()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-text-tertiary text-center mt-1">
          {progressPercent < 100 ? `${Math.round(progressPercent)}% complete` : "Almost ready..."}
        </p>
      </div>
    </div>
  );
}
