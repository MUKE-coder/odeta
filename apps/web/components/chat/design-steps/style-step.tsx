"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { THEMES, THEME_CATEGORIES } from "@/lib/themes";
import { ArrowRight, Check } from "lucide-react";

export function StyleStep({ onSelect }: { onSelect: (themeId: string) => void }) {
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = category === "all" ? THEMES : THEMES.filter((t) => t.category === category);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Choose your visual style</h2>
          <p className="text-sm text-gray-500 mt-1">Sets the overall look and feel of your app</p>
        </div>
        {selected && (
          <button
            onClick={() => onSelect(selected)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Use {THEMES.find((t) => t.id === selected)?.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {THEME_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              category === cat.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {filtered.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelected(theme.id)}
            className={cn(
              "relative p-0 rounded-xl overflow-hidden border-2 transition-all text-left",
              selected === theme.id
                ? "border-blue-600 shadow-lg scale-[1.02]"
                : "border-transparent hover:border-gray-300 hover:shadow-md"
            )}
          >
            {/* Brand badge */}
            {theme.category === "brand" && (
              <div className="absolute top-2 left-2 z-10">
                <span className="text-[8px] font-bold uppercase tracking-wider bg-black/30 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                  Brand
                </span>
              </div>
            )}
            {/* Mini app preview */}
            <div className="h-24 p-2.5" style={{ backgroundColor: theme.preview.bg }}>
              <div
                className="h-4 rounded flex items-center px-2 gap-1.5 mb-1.5"
                style={{ backgroundColor: theme.preview.surface, border: `1px solid ${theme.preview.border}` }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: theme.preview.border }} />
                <div className="w-4 h-1.5 rounded" style={{ backgroundColor: theme.preview.accent }} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div
                  className="h-7 rounded"
                  style={{ backgroundColor: theme.preview.surface, border: `1px solid ${theme.preview.border}`, borderRadius: theme.preview.radius }}
                />
                <div
                  className="h-7 rounded flex items-center justify-center"
                  style={{ backgroundColor: theme.preview.accent, borderRadius: "6px" }}
                >
                  <div className="w-4 h-1 rounded-full bg-white opacity-80" />
                </div>
              </div>
              <div className="mt-1.5 space-y-1">
                <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: theme.preview.text, opacity: 0.5 }} />
                <div className="h-1 rounded-full w-1/2" style={{ backgroundColor: theme.preview.text, opacity: 0.25 }} />
              </div>
            </div>

            <div className="px-2.5 py-2 border-t" style={{ backgroundColor: theme.preview.surface, borderColor: theme.preview.border }}>
              <p className="text-xs font-semibold" style={{ color: theme.preview.text }}>{theme.name}</p>
              <p className="text-[10px] opacity-60 leading-tight mt-0.5" style={{ color: theme.preview.text }}>
                {theme.description}
              </p>
            </div>

            {selected === theme.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
