"use client";

import { Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseAIMessage } from "./message-parser";
import { QuestionCard } from "./question-card";
import { CommandCard } from "./command-card";
import { JBCommandCard } from "./jb-command-card";
import { CodeBlock } from "./code-block";
import { PlanCard } from "./plan-card";

interface AIMessageProps {
  content: string;
  isStreaming?: boolean;
  onOptionSelect?: (option: string) => void;
  answeredQuestions?: Record<string, string>;
  activeCommandIndex?: number | null;
  completedCommandIndexes?: number[];
  currentCommandOutput?: string[];
}

export function AIMessage({
  content,
  isStreaming,
  onOptionSelect,
  answeredQuestions = {},
  activeCommandIndex = null,
  completedCommandIndexes = [],
  currentCommandOutput = [],
}: AIMessageProps) {
  const blocks = parseAIMessage(content);

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-accent-light border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "text":
              return (
                <div
                  key={i}
                  className="prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-ul:text-gray-700 prose-li:marker:text-gray-400"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.content}
                  </ReactMarkdown>
                </div>
              );
            case "question": {
              const answered = answeredQuestions[block.text];
              return (
                <QuestionCard
                  key={i}
                  text={block.text}
                  questionType={block.questionType}
                  options={block.options}
                  placeholder={block.placeholder}
                  isAnswered={!!answered}
                  selectedAnswer={answered}
                  onSelect={(answer) => {
                    onOptionSelect?.(answer);
                  }}
                />
              );
            }
            case "command":
              return (
                <CommandCard
                  key={i}
                  content={block.content}
                  label={block.label}
                />
              );
            case "jb-command":
              return (
                <JBCommandCard
                  key={i}
                  url={block.url}
                  component={block.component}
                  description={block.description}
                />
              );
            case "code":
              return (
                <CodeBlock
                  key={i}
                  language={block.language}
                  content={block.content}
                  filename={block.filename}
                />
              );
            case "file":
              // Don't show individual file blocks in chat — show a compact summary
              // Count consecutive file blocks
              if (i > 0 && blocks[i - 1]?.type === "file") return null; // skip if not first file
              const fileBlocks = blocks.filter((b): b is Extract<typeof b, { type: "file" }> => b.type === "file");
              return (
                <div key={i} className="rounded-xl border border-green-200 bg-green-50 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    <span className="text-sm font-semibold text-green-800">{fileBlocks.length} files generated</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {fileBlocks.slice(0, 12).map((f, fi) => (
                      <span key={fi} className="text-[10px] font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {f.path.split("/").pop()}
                      </span>
                    ))}
                    {fileBlocks.length > 12 && (
                      <span className="text-[10px] text-green-600">+{fileBlocks.length - 12} more</span>
                    )}
                  </div>
                  <p className="text-xs text-green-600 mt-2">Click &quot;Open in StackBlitz&quot; in the Preview panel to see your app live →</p>
                </div>
              );
            case "plan":
              return (
                <PlanCard
                  key={i}
                  title={block.title}
                  items={block.items}
                  activeIndex={activeCommandIndex}
                  completedIndexes={completedCommandIndexes}
                  currentOutput={currentCommandOutput}
                />
              );
            default:
              return null;
          }
        })}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-accent animate-pulse rounded-sm ml-0.5" />
        )}
      </div>
    </div>
  );
}
