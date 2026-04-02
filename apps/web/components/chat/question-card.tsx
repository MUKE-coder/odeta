"use client";

import { useState } from "react";

interface QuestionCardProps {
  text: string;
  options: string[];
  onSelect: (option: string) => void;
}

export function QuestionCard({ text, options, onSelect }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    onSelect(option);
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-foreground mb-3">{text}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={!!selected}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === option
                ? "border-accent bg-accent text-white"
                : selected
                  ? "border-border bg-surface text-text-tertiary opacity-50"
                  : "border-border bg-white text-text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
