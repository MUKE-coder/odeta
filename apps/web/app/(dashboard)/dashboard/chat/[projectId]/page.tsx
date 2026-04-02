"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useOdetaChat, type ChatMessage } from "@/hooks/use-chat";
import { parseAIMessage } from "@/components/chat/message-parser";
import { QuestionCard } from "@/components/chat/question-card";
import { CommandCard } from "@/components/chat/command-card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Code, Eye, FolderTree, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [rightTab, setRightTab] = useState<"preview" | "code" | "files">("preview");

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });

  const project = projectData?.data;

  const {
    messages,
    isStreaming,
    sendMessage,
  } = useOdetaChat({
    projectId,
    onCreditsUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (error: string) => {
      toast.error(error);
    },
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  }

  function handleQuestionSelect(option: string) {
    sendMessage(option);
  }

  return (
    <div className="-m-6 md:-m-8 flex h-screen flex-col">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-text-tertiary hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-sm text-foreground truncate max-w-[200px]">
            {project?.name || "Project"}
          </span>
          {project?.status && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-secondary uppercase tracking-wider">
              {project.status}
            </span>
          )}
        </div>
        <button
          disabled
          className="rounded-lg border bg-surface px-3 py-1.5 text-xs text-text-tertiary cursor-not-allowed"
          title="Publish when your app is ready"
        >
          Publish
        </button>
      </div>

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex w-full flex-col border-r lg:w-[420px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !isStreaming && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-tertiary text-center">
                  Describe your project and I&apos;ll help you build it.
                </p>
              </div>
            )}

            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] space-y-2">
                    {parseAIMessage(msg.content).map((block, i) => {
                      if (block.type === "question") {
                        return (
                          <QuestionCard
                            key={i}
                            text={block.content}
                            options={block.options || []}
                            onSelect={handleQuestionSelect}
                          />
                        );
                      }
                      if (block.type === "command" || block.type === "jb-command") {
                        return (
                          <CommandCard
                            key={i}
                            command={block.content}
                            type={block.type}
                          />
                        );
                      }
                      return (
                        <div
                          key={i}
                          className="rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-sm text-foreground"
                        >
                          {block.content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-surface px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3">
            <div className="flex items-end rounded-xl border bg-white">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Make, test, iterate..."
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="m-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-30 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-text-tertiary">
              1 credit per message
            </p>
          </div>
        </div>

        {/* Right: Preview/Code/Files */}
        <div className="hidden flex-1 flex-col lg:flex">
          {/* Tabs */}
          <div className="flex border-b bg-white">
            {(["preview", "code", "files"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  rightTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-foreground"
                }`}
              >
                {tab === "preview" && <Eye className="h-3.5 w-3.5" />}
                {tab === "code" && <Code className="h-3.5 w-3.5" />}
                {tab === "files" && <FolderTree className="h-3.5 w-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-1 items-center justify-center bg-surface">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border">
                {rightTab === "preview" && <Eye className="h-5 w-5 text-text-tertiary" />}
                {rightTab === "code" && <Code className="h-5 w-5 text-text-tertiary" />}
                {rightTab === "files" && <FolderTree className="h-5 w-5 text-text-tertiary" />}
              </div>
              <p className="text-sm text-text-secondary">
                {rightTab === "preview"
                  ? "Your app will appear here as it's built"
                  : rightTab === "code"
                    ? "Generated code will appear here"
                    : "Project files will appear here"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
