"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { FontStep } from "./design-steps/font-step";
import { ColorStep } from "./design-steps/color-step";
import { StyleStep } from "./design-steps/style-step";
import { InspirationUpload } from "./design-steps/inspiration-upload";

type DesignStep = "font" | "color" | "style" | "inspiration";

export interface DesignChoices {
  font: string;
  colorScheme: string;
  theme: string;
  inspirationNote?: string;
}

interface DesignPhaseProps {
  isPaid?: boolean;
  onComplete: (choices: DesignChoices) => void;
}

export function DesignPhase({ isPaid = false, onComplete }: DesignPhaseProps) {
  const [step, setStep] = useState<DesignStep>("font");
  const [choices, setChoices] = useState<Partial<DesignChoices>>({});

  const steps: { key: DesignStep; label: string }[] = [
    { key: "font", label: "Typography" },
    { key: "color", label: "Colors" },
    { key: "style", label: "Style" },
  ];

  function finalize(extra?: Partial<DesignChoices>) {
    const final = { ...choices, ...extra } as DesignChoices;
    onComplete(final);
  }

  return (
    <div className="flex flex-col h-full justify-center px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                step === s.key
                  ? "bg-blue-600 text-white"
                  : choices[s.key === "style" ? "theme" : s.key === "color" ? "colorScheme" : "font"]
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-400"
              )}
            >
              {choices[s.key === "style" ? "theme" : s.key === "color" ? "colorScheme" : "font"] && step !== s.key ? (
                <Check className="w-3 h-3" />
              ) : (
                <span>{i + 1}</span>
              )}
              {s.label}
            </div>
            {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      {step === "font" && (
        <FontStep
          onSelect={(font) => {
            setChoices((c) => ({ ...c, font }));
            setStep("color");
          }}
        />
      )}
      {step === "color" && (
        <ColorStep
          onSelect={(colorScheme) => {
            setChoices((c) => ({ ...c, colorScheme }));
            setStep("style");
          }}
        />
      )}
      {step === "style" && (
        <StyleStep
          onSelect={(theme) => {
            setChoices((c) => ({ ...c, theme }));
            setStep("inspiration");
          }}
        />
      )}
      {step === "inspiration" && (
        <div className="space-y-4">
          <InspirationUpload
            isPaid={isPaid}
            onAnalysisComplete={(note) => finalize({ inspirationNote: note })}
          />
          <button
            onClick={() => finalize()}
            className="w-full py-2.5 text-sm font-medium text-foreground border rounded-xl hover:bg-surface transition-colors"
          >
            Skip — start building
          </button>
        </div>
      )}
    </div>
  );
}
