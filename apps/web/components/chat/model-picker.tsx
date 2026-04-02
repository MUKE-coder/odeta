"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronUp, Lock } from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  label: string;
  provider: "anthropic" | "openai" | "google";
  tier: "free" | "paid";
  description: string;
}

const MODELS: AIModel[] = [
  { id: "google/gemini-2.0-flash", name: "Gemini Flash", label: "Fast", provider: "google", tier: "free", description: "Fast and capable. Great for most tasks." },
  { id: "google/gemini-2.5-pro", name: "Gemini Pro", label: "Balanced", provider: "google", tier: "free", description: "Smarter reasoning. Handles complex apps." },
  { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet", label: "Smart", provider: "anthropic", tier: "paid", description: "Excellent code quality. Best for full-stack." },
  { id: "anthropic/claude-opus-4-5", name: "Claude Opus", label: "Powerful", provider: "anthropic", tier: "paid", description: "Maximum intelligence. Complex architectures." },
  { id: "openai/gpt-4o", name: "GPT-4o", label: "Versatile", provider: "openai", tier: "paid", description: "Fast, capable, multimodal." },
  { id: "openai/o3-mini", name: "o3-mini", label: "Reasoning", provider: "openai", tier: "paid", description: "Deep reasoning for complex logic." },
];

const PROVIDER_STYLE: Record<string, { icon: string; color: string }> = {
  anthropic: { icon: "✦", color: "text-orange-600 bg-orange-50" },
  openai: { icon: "⬡", color: "text-green-600 bg-green-50" },
  google: { icon: "✦", color: "text-blue-600 bg-blue-50" },
};

interface ModelPickerProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  isPaid: boolean;
}

export function ModelPicker({ selectedModel, onSelect, isPaid }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const current = MODELS.find((m) => m.id === selectedModel) || MODELS[0];
  const style = PROVIDER_STYLE[current.provider];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-text-secondary border rounded-lg hover:bg-surface transition-colors"
      >
        <span className={cn("w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold", style.color)}>
          {style.icon}
        </span>
        <span>{current.name}</span>
        <ChevronUp className={cn("w-3 h-3 text-text-tertiary transition-transform", !open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border rounded-xl shadow-xl z-20 overflow-hidden">
            {/* Free models */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Free</p>
            </div>
            {MODELS.filter((m) => m.tier === "free").map((model) => (
              <ModelOption
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                isLocked={false}
                onClick={() => { onSelect(model.id); setOpen(false); }}
              />
            ))}

            {/* Paid models */}
            <div className="px-3 pt-3 pb-1 mt-1 border-t">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Pro Models</p>
            </div>
            {MODELS.filter((m) => m.tier === "paid").map((model) => (
              <ModelOption
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                isLocked={!isPaid}
                onClick={() => { if (isPaid) { onSelect(model.id); setOpen(false); } }}
              />
            ))}

            <div className="px-3 py-2 border-t bg-surface">
              <p className="text-[9px] text-text-tertiary">Powered by Vercel AI Gateway</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModelOption({
  model,
  isSelected,
  isLocked,
  onClick,
}: {
  model: AIModel;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}) {
  const style = PROVIDER_STYLE[model.provider];

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
        isSelected ? "bg-accent-light" : "hover:bg-surface",
        isLocked && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={cn("w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5", style.color)}>
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">{model.name}</span>
          <span className="text-[9px] font-medium text-text-tertiary bg-surface px-1 py-0.5 rounded">{model.label}</span>
          {isLocked && <Lock className="w-3 h-3 text-text-tertiary ml-auto" />}
          {isSelected && <Check className="w-3 h-3 text-accent ml-auto" />}
        </div>
        <p className="text-[10px] text-text-tertiary mt-0.5">{model.description}</p>
      </div>
    </button>
  );
}
