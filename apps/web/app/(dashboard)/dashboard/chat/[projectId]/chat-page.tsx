"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useOdetaChat, type ChatMessage } from "@/hooks/use-chat";
import { AIMessage } from "@/components/chat/ai-message";
import { CommandCard } from "@/components/chat/command-card";
import { UserMessage } from "@/components/chat/user-message";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { HistorySkeleton } from "@/components/chat/history-skeleton";
import { DesignPhase, type DesignChoices } from "@/components/chat/design-phase";
import { EnvTab } from "@/components/chat/env-tab";
import { ModelPicker } from "@/components/chat/model-picker";
import { EditorPanel } from "@/components/editor/editor-panel";
import { BuildPreview } from "@/components/editor/build-preview";
import { SandboxPreview } from "@/components/editor/sandbox-preview";
import { ProjectActions } from "@/components/project/project-actions";
import { PreviewToolbar, type DeviceId } from "@/components/editor/preview-toolbar";
import { THEMES } from "@/lib/themes";
import { useAuth } from "@/hooks/use-auth";
import { loadDraft, saveDraft, clearDraft } from "@/lib/chat-draft";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, Code, Eye, FileIcon, GripVertical, Key, Loader2, Paperclip, X } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  // In static export, useParams may return "placeholder" before hydration.
  // Fall back to extracting the real ID from the URL.
  const rawParam = params.projectId as string;
  const projectId = rawParam === "placeholder"
    ? (typeof window !== "undefined" ? window.location.pathname.split("/chat/")[1]?.replace(/\/$/, "") : rawParam)
    : rawParam;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState(() => loadDraft(projectId));
  const [rightTab, setRightTab] = useState<"preview" | "code" | "env">("preview");
  const [splitPos, setSplitPos] = useState(45);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash");
  const [previewDevice, setPreviewDevice] = useState<DeviceId>("desktop");
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const isPaid = user?.plan === "starter" || user?.plan === "pro";

  // No WebContainer boot needed — files are saved on server, preview via StackBlitz
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

  // Load generated files if project is already built
  useEffect(() => {
    if (project?.status === "BUILT" && generatedFiles.length === 0) {
      apiClient.get(`/api/projects/${projectId}/files/all`)
        .then(({ data }) => {
          const files = data?.files;
          if (files && typeof files === "object") {
            setGeneratedFiles(Object.keys(files));
            setFileContents(files);
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status]);

  // Check if design phase is complete
  const metadata = project?.metadata ? (typeof project.metadata === "string" ? JSON.parse(project.metadata) : project.metadata) : {};
  const [designComplete, setDesignComplete] = useState(false);
  const isDesignDone = designComplete || metadata?.designPhaseComplete;

  async function handleDesignComplete(choices: DesignChoices) {
    const theme = THEMES.find((t) => t.id === choices.theme);

    // Save design choices — don't block if it fails
    try {
      await apiClient.patch(`/api/projects/${projectId}/metadata`, {
        designFont: choices.font,
        designColorScheme: choices.colorScheme,
        designTheme: choices.theme,
        designPhaseComplete: true,
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    } catch {
      // Continue anyway — design choices are secondary
    }

    // Always proceed regardless of save success
    setDesignComplete(true);

    const openingMsg = project?.description
      ? `Build this: ${project.description}. Use ${theme?.name || choices.theme} visual style, ${choices.font} font, ${choices.colorScheme} colors.`
      : `Let's build: ${project?.name || "my project"}. Use ${theme?.name || choices.theme} style.`;
    setTimeout(() => sendMessage(openingMsg), 300);
  }

  const { messages, isStreaming, isLoadingHistory, isExecuting, runningCommand, buildProgress, sendMessage } = useOdetaChat({
    projectId,
    onCreditsUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (error: string) => {
      toast.error(error);
    },
    onFilesGenerated: (files: string[]) => {
      setGeneratedFiles(files);
      // Fetch full file contents for StackBlitz embed
      apiClient.get(`/api/projects/${projectId}/files/all`)
        .then(({ data }) => {
          if (data?.files) setFileContents(data.files);
        })
        .catch(() => {});
    },
  });

  // Preview updates automatically via fileContents state

  // No more command execution state — files are generated directly
  const activeCommandIndex = null;
  const completedCommandIndexes: number[] = [];
  const currentCommandOutput: string[] = [];
  const buildProgressPercent = 0;

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
        {project && <ProjectActions project={project} />}
      </div>

      {/* Two panels */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-col" style={{ width: `${splitPos}%` }}>
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {!isDesignDone && !isLoadingHistory && messages.length === 0 ? (
              <DesignPhase onComplete={handleDesignComplete} />
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
                  answeredQuestions={answeredQuestions}
                  activeCommandIndex={msg.id === lastMsg?.id ? activeCommandIndex : null}
                  completedCommandIndexes={msg.id === lastMsg?.id ? completedCommandIndexes : []}
                  currentCommandOutput={msg.id === lastMsg?.id ? currentCommandOutput : []}
                />
              )
            )}

            {showSkeleton && <MessageSkeleton />}

            <div ref={messagesEndRef} />
          </div>

          {/* Credit indicator */}
          {!isExecuting && (
            <div className="text-center py-1">
              <span className="text-[10px] text-text-tertiary">1 credit per message</span>
            </div>
          )}

          {/* Input */}
          <div className="border-t bg-white p-3">
            {/* Model picker */}
            <div className="mb-2">
              <ModelPicker selectedModel={selectedModel} onSelect={setSelectedModel} isPaid={isPaid} />
            </div>
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
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  handleInputChange(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                placeholder="Make, test, iterate..."
                rows={3}
                className="flex-1 resize-none rounded-2xl border bg-white px-4 py-3.5 text-sm leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 disabled:opacity-50 overflow-y-auto"
                style={{ minHeight: "80px", maxHeight: "200px" }}
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
          ) : rightTab === "code" ? (
            <EditorPanel />
          ) : (
            <>
              <PreviewToolbar activeDevice={previewDevice} onDeviceChange={setPreviewDevice} />

              <div className="flex-1 min-h-0">
                <SandboxPreview files={fileContents} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
