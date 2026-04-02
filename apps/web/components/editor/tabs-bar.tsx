"use client";

import { cn } from "@/lib/utils";
import { File, X } from "lucide-react";

interface Tab {
  path: string;
  name: string;
}

interface TabsBarProps {
  tabs: Tab[];
  activeTab: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function TabsBar({ tabs, activeTab, onSelect, onClose }: TabsBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-end overflow-x-auto border-b bg-gray-50"
      style={{ minHeight: 33 }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.path}
          onClick={() => onSelect(tab.path)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border-r cursor-pointer",
            "text-[11px] whitespace-nowrap transition-colors flex-shrink-0 group",
            activeTab === tab.path
              ? "bg-white border-t-2 border-t-accent text-foreground"
              : "text-text-tertiary hover:bg-gray-100 hover:text-foreground"
          )}
        >
          <File className="w-3 h-3 flex-shrink-0" />
          <span>{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.path);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded p-0.5 transition-all"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
