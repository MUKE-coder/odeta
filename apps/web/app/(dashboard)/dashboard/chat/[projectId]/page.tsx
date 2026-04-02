"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useOdetaChat, type ChatMessage } from "@/hooks/use-chat";
import { AIMessage } from "@/components/chat/ai-message";
import { UserMessage } from "@/components/chat/user-message";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { HistorySkeleton } from "@/components/chat/history-skeleton";
import { DesignPhase, type DesignChoices } from "@/components/chat/design-phase";
import { EnvTab } from "@/components/chat/env-tab";
import { THEMES } from "@/lib/themes";
import { useAuth } from "@/hooks/use-auth";
import { loadDraft, saveDraft, clearDraft } from "@/lib/chat-draft";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, Code, Eye, FileIcon, GripVertical, Key, Loader2, Paperclip, X } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState(() => loadDraft(projectId));
  const [rightTab, setRightTab] = useState<"preview" | "code" | "env">("preview");
  const [splitPos, setSplitPos] = useState(45);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const isPaid = user?.plan === "starter" || user?.plan === "pro";
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });
  const project = projectData?.data;

  // Check if design phase is complete
  const metadata = project?.metadata ? (typeof project.metadata === "string" ? JSON.parse(project.metadata) : project.metadata) : {};
  const [designComplete, setDesignComplete] = useState(false);
  const isDesignDone = designComplete || metadata?.designPhaseComplete;

  async function handleDesignComplete(choices: DesignChoices) {
    const theme = THEMES.find((t) => t.id === choices.theme);
    try {
      await apiClient.patch(`/api/projects/${projectId}/metadata`, {
        designFont: choices.font,
        designColorScheme: choices.colorScheme,
        designTheme: choices.theme,
        designPhaseComplete: true,
      });
      setDesignComplete(true);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });

      // Auto-send first message with design context
      const designMsg = `Build this project. Design: ${choices.font} font, ${choices.colorScheme} colors, ${theme?.name || choices.theme} style.`;
      setTimeout(() => sendMessage(designMsg), 300);
    } catch {
      toast.error("Failed to save design choices");
    }
  }

  const { messages, isStreaming, isLoadingHistory, sendMessage } = useOdetaChat({
    projectId,
    onCreditsUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (error: string) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Resizer
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSplitPos(Math.max(25, Math.min(75, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function handleSend() {
    if (!input.trim() || isStreaming) return;
    clearDraft(projectId);
    sendMessage(input.trim());
    setInput("");
  }

  function handleInputChange(value: string) {
    setInput(value);
    saveDraft(projectId, value);
  }

  function handleOptionSelect(option: string) {
    sendMessage(option);
  }

  const lastMsg = messages[messages.length - 1];
  const showSkeleton = isStreaming && lastMsg?.role === "assistant" && lastMsg?.content === "";

  return (
    <div className="-m-6 md:-m-8 flex h-screen flex-col">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-text-tertiary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-sm text-foreground truncate max-w-[240px]">
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
          className="rounded-lg border px-3 py-1 text-xs text-text-tertiary cursor-not-allowed"
          title="Publish when your app is ready"
        >
          Publish
        </button>
      </div>

      {/* Two panels */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-col" style={{ width: `${splitPos}%` }}>
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {!isDesignDone && !isLoadingHistory && messages.length === 0 ? (
              <DesignPhase isPaid={isPaid} onComplete={handleDesignComplete} />
            ) : isLoadingHistory ? (
              <HistorySkeleton />
            ) : messages.length === 0 && !isStreaming ? (
              <div className="flex h-full items-center justify-center px-8">
                <p className="text-sm text-text-tertiary text-center">
                  Describe what you want to build and I&apos;ll help you create it step by step.
                </p>
              </div>
            ) : null}

            {messages.map((msg: ChatMessage) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} content={msg.content} />
              ) : (
                <AIMessage
                  key={msg.id}
                  content={msg.content}
                  isStreaming={isStreaming && msg.id === lastMsg?.id}
                  onOptionSelect={handleOptionSelect}
                />
              )
            )}

            {showSkeleton && <MessageSkeleton />}
            <div ref={messagesEndRef} />
          </div>

          {/* Credit indicator */}
          <div className="text-center py-1">
            <span className="text-[10px] text-text-tertiary">1 credit per message</span>
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3">
            {/* Attached file preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-accent-light border border-blue-200 rounded-lg text-xs">
                <FileIcon className="w-3.5 h-3.5 text-accent" />
                <span className="text-accent font-medium truncate max-w-[160px]">{attachedFile.name}</span>
                <span className="text-text-tertiary">({(attachedFile.size / 1024).toFixed(0)}KB)</span>
                <button onClick={() => setAttachedFile(null)} className="ml-auto">
                  <X className="w-3 h-3 text-accent hover:text-accent-hover" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              {/* File attachment button */}
              <div className="flex-shrink-0 relative group">
                {isPaid ? (
                  <label className="w-9 h-9 rounded-xl border bg-white flex items-center justify-center cursor-pointer hover:bg-surface hover:border-border-strong transition-colors">
                    <Paperclip className="w-4 h-4 text-text-secondary" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.txt,.md,.env"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File must be under 5MB");
                            return;
                          }
                          setAttachedFile(file);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <>
                    <button
                      className="w-9 h-9 rounded-xl border bg-surface flex items-center justify-center cursor-not-allowed"
                      title="File upload requires a paid plan"
                    >
                      <Paperclip className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg">
                        Upgrade to attach files
                      </div>
                    </div>
                  </>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Make, test, iterate..."
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-white px-4 py-2.5 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 disabled:opacity-50"
                style={{ minHeight: "44px", maxHeight: "160px" }}
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
                className="w-9 h-9 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className="flex w-1.5 cursor-col-resize items-center justify-center bg-gray-100 hover:bg-accent-light transition-colors"
        >
          <GripVertical className="h-4 w-4 text-text-tertiary" />
        </div>

        {/* Right: Preview/Code */}
        <div className="hidden flex-1 flex-col lg:flex">
          <div className="flex border-b bg-white">
            {(["preview", "code", "env"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                  rightTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-foreground"
                }`}
              >
                {tab === "preview" && <Eye className="h-3.5 w-3.5" />}
                {tab === "code" && <Code className="h-3.5 w-3.5" />}
                {tab === "env" && <Key className="h-3.5 w-3.5" />}
                {tab === "env" ? "Env" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {rightTab === "env" ? (
            <EnvTab projectId={projectId} />
          ) : (
          <div className="flex flex-1 items-center justify-center bg-surface">
            <div className="text-center px-8">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border">
                {rightTab === "preview" ? (
                  <Eye className="h-5 w-5 text-text-tertiary" />
                ) : (
                  <Code className="h-5 w-5 text-text-tertiary" />
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {rightTab === "preview"
                  ? "Your app preview will appear here as it's built"
                  : "Generated code will appear here"}
              </p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
