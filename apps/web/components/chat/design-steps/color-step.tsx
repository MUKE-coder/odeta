"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { COLOR_PALETTES } from "@/lib/themes";
import { Check } from "lucide-react";

export function ColorStep({ onSelect }: { onSelect: (color: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (selected) return;
    setSelected(id);
    setTimeout(() => onSelect(id), 200);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Choose your color scheme</h2>
        <p className="text-sm text-gray-500 mt-1">Sets your primary brand color throughout the app</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            onClick={() => handleSelect(palette.id)}
            disabled={!!selected}
            className={cn(
              "relative p-3 rounded-xl border-2 transition-all text-left",
              selected === palette.id
                ? "border-gray-900 shadow-md scale-[0.98]"
                : selected
                  ? "border-gray-200 opacity-50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            )}
          >
            <div className="flex gap-1 mb-2.5">
              {palette.preview.map((color, i) => (
                <div key={i} className="flex-1 h-6 rounded-md" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: palette.primary }} />
              <span className="text-xs font-semibold text-gray-700">{palette.name}</span>
            </div>
            {selected === palette.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-3.5 h-3.5 text-gray-900" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
