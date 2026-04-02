"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface QuestionCardProps {
  text: string;
  questionType: "choice" | "text" | "multi";
  options?: string[];
  placeholder?: string;
  onSelect: (answer: string) => void;
  isAnswered?: boolean;
  selectedAnswer?: string;
}

export function QuestionCard({
  text,
  questionType,
  options = [],
  placeholder,
  onSelect,
  isAnswered = false,
  selectedAnswer,
}: QuestionCardProps) {
  const [textValue, setTextValue] = useState("");
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  function handleChoiceSelect(option: string) {
    if (isAnswered) return;
    setLocalSelected(option);
    setTimeout(() => onSelect(option), 200);
  }

  function handleTextSubmit() {
    if (!textValue.trim() || isAnswered) return;
    onSelect(textValue.trim());
  }

  function handleMultiSubmit() {
    if (multiSelected.size === 0 || isAnswered) return;
    onSelect(Array.from(multiSelected).join(", "));
  }

  function toggleMulti(option: string) {
    if (isAnswered) return;
    setMultiSelected((prev) => {
      const next = new Set(prev);
      next.has(option) ? next.delete(option) : next.add(option);
      return next;
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-200",
        isAnswered
          ? "border-gray-200 bg-gray-50"
          : "border-blue-200 bg-white shadow-sm"
      )}
    >
      {/* Question header */}
      <div
        className={cn(
          "px-4 py-3 border-b",
          isAnswered ? "border-gray-200 bg-gray-50" : "border-blue-100 bg-blue-50/60"
        )}
      >
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            isAnswered ? "text-gray-500" : "text-gray-900"
          )}
        >
          {text}
        </p>
      </div>

      {/* Answer area */}
      <div className="p-4">
        {/* CHOICE */}
        {questionType === "choice" && (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const isThis = localSelected === option || selectedAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => handleChoiceSelect(option)}
                  disabled={isAnswered}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
                    isThis && isAnswered
                      ? "bg-blue-600 text-white border-blue-600"
                      : isThis
                        ? "bg-blue-600 text-white border-blue-600 scale-95"
                        : isAnswered
                          ? "bg-white text-gray-300 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 cursor-pointer active:scale-95"
                  )}
                >
                  {isThis && isAnswered && (
                    <Check className="w-3 h-3 inline mr-1.5" />
                  )}
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* TEXT */}
        {questionType === "text" && (
          <div className="space-y-2">
            {isAnswered ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{selectedAnswer}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder={placeholder || "Type your answer..."}
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-400"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MULTI */}
        {questionType === "multi" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected =
                  multiSelected.has(option) ||
                  (isAnswered && selectedAnswer?.split(", ").includes(option));
                return (
                  <button
                    key={option}
                    onClick={() => toggleMulti(option)}
                    disabled={isAnswered}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
                      isSelected
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : isAnswered
                          ? "bg-white text-gray-300 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                      )}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </div>
                    {option}
                  </button>
                );
              })}
            </div>
            {!isAnswered && multiSelected.size > 0 && (
              <button
                onClick={handleMultiSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Continue with {multiSelected.size} selected
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
