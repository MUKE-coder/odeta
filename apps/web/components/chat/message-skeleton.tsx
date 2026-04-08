"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const THINKING_MESSAGES = [
  "Analyzing your requirements...",
  "Designing the data model...",
  "Planning the component structure...",
  "Writing the code...",
  "Building your pages...",
  "Creating API routes...",
  "Setting up the database schema...",
  "Generating UI components...",
  "Adding form validation...",
  "Writing styles and layouts...",
];

export function MessageSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
      </div>
      <div className="flex-1 pt-0.5">
        {/* Thinking message */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span key={msgIndex} className="text-sm text-blue-600 font-medium animate-pulse">
            {THINKING_MESSAGES[msgIndex]}
          </span>
        </div>

        {/* Shimmer skeleton lines */}
        <div className="space-y-2.5">
          <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full animate-shimmer w-3/4" style={{ backgroundSize: "200% 100%" }} />
          <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full animate-shimmer w-1/2" style={{ backgroundSize: "200% 100%", animationDelay: "100ms" }} />
          <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full animate-shimmer w-5/6" style={{ backgroundSize: "200% 100%", animationDelay: "200ms" }} />
        </div>
      </div>
    </div>
  );
}
