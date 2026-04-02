"use client";

import { Zap } from "lucide-react";

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-accent-light border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-1/2" />
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-5/6" />
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );
}
