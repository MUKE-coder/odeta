"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FONT_PAIRINGS } from "@/lib/themes";

export function FontStep({ onSelect }: { onSelect: (font: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (selected) return;
    setSelected(id);
    setTimeout(() => onSelect(id), 200);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Choose your typography</h2>
        <p className="text-sm text-gray-500 mt-1">Pick a font pairing for your app</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FONT_PAIRINGS.map((pair) => (
          <button
            key={pair.id}
            onClick={() => handleSelect(pair.id)}
            disabled={!!selected}
            className={cn(
              "relative text-left p-4 rounded-xl border-2 transition-all",
              selected === pair.id
                ? "border-blue-600 bg-blue-50 scale-[0.98]"
                : selected
                  ? "border-gray-200 bg-white opacity-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
            )}
          >
            {pair.popular && (
              <span className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <p className="text-2xl font-bold text-gray-900 leading-tight">Aa</p>
            <p className="text-sm text-gray-500 mt-0.5">The quick brown fox</p>
            <p className="text-sm font-semibold text-gray-800 mt-2">{pair.name}</p>
            <p className="text-xs text-blue-600 font-medium">{pair.label}</p>
            <p className="text-xs text-gray-400 mt-1">{pair.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
