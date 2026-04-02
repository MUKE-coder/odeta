"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { FontStep } from "./design-steps/font-step";
import { ColorStep } from "./design-steps/color-step";
import { StyleStep } from "./design-steps/style-step";

type DesignStep = "font" | "color" | "style" | "complete";

export interface DesignChoices {
  font: string;
  colorScheme: string;
  theme: string;
}

interface DesignPhaseProps {
  isPaid?: boolean;
  onComplete: (choices: DesignChoices) => void;
}

export function DesignPhase({ onComplete }: DesignPhaseProps) {
  const [step, setStep] = useState<DesignStep>("font");
  const [choices, setChoices] = useState<Partial<DesignChoices>>({});

  const steps: { key: "font" | "color" | "style"; label: string }[] = [
    { key: "font", label: "Typography" },
    { key: "color", label: "Colors" },
    { key: "style", label: "Style" },
  ];

  // Show completion animation, then call onComplete
  if (step === "complete") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Design locked in</p>
        <p className="text-xs text-gray-500">Starting your build...</p>
        <div className="flex gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
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
            const final: DesignChoices = {
              font: choices.font!,
              colorScheme: choices.colorScheme!,
              theme,
            };
            setChoices(final);
            setStep("complete");
            // Call onComplete after the animation plays
            setTimeout(() => onComplete(final), 800);
          }}
        />
      )}
    </div>
  );
}
