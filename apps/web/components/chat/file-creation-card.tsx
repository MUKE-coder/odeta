"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCircle, File, Loader2, Terminal } from "lucide-react";

interface FileEvent {
  path: string;
  status: "writing" | "done";
  size?: number;
}

interface FileCreationCardProps {
  files: FileEvent[];
  isActive: boolean;
  currentCommand?: string;
}

export function FileCreationCard({
  files,
  isActive,
  currentCommand,
}: FileCreationCardProps) {
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-success" />
          )}
          <span className="text-xs font-semibold text-foreground">
            {isActive ? "Building your project..." : "Build complete"}
          </span>
        </div>
        <span className="text-[10px] text-text-tertiary">
          {doneCount} file{doneCount !== 1 ? "s" : ""} created
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
        {files.map((file, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-1.5">
            {file.status === "writing" ? (
              <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              </div>
            ) : (
              <Check className="w-3 h-3 text-success flex-shrink-0" />
            )}
            <File className="w-3 h-3 text-text-tertiary flex-shrink-0" />
            <span
              className={cn(
                "text-[11px] font-mono flex-1 truncate",
                file.status === "writing"
                  ? "text-accent font-semibold"
                  : "text-text-secondary"
              )}
            >
              {file.path}
            </span>
            {file.size && (
              <span className="text-[9px] text-text-tertiary flex-shrink-0">
                {file.size > 1024
                  ? `${(file.size / 1024).toFixed(1)}KB`
                  : `${file.size}B`}
              </span>
            )}
          </div>
        ))}

        {currentCommand && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900">
            <Terminal className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <code className="text-[10px] text-green-400 font-mono truncate flex-1">
              {currentCommand}
            </code>
            <Loader2 className="w-3 h-3 text-gray-500 animate-spin flex-shrink-0" />
          </div>
        )}
      </div>

      {isActive && (
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min((doneCount / Math.max(files.length, 1)) * 100, 95)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
