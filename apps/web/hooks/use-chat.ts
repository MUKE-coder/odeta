"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
  timestamp: Date;
}

interface UseChatOptions {
  projectId: string | number;
  onCreditsUpdate?: (used: number, remaining: number) => void;
  onError?: (error: string) => void;
  onFileWrite?: (path: string, content: string) => void;
  onCommandExec?: (command: string, label: string, index: number, total: number) => void;
}

interface ConversationRow {
  id: number;
  role: string;
  content: string;
  created_at: string;
  credits_used: number;
}

export function useOdetaChat({ projectId, onCreditsUpdate, onError, onFileWrite, onCommandExec }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [runningCommand, setRunningCommand] = useState<{ label: string; command: string; output: string[]; index?: number; total?: number } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [buildProgress, setBuildProgress] = useState<{ completed: number; total: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    if (!projectId) return;
    setIsLoadingHistory(true);

    const token = Cookies.get("access_token");
    fetch(`${API_URL}/api/projects/${projectId}/conversations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((result) => {
        const rows: ConversationRow[] = result.data || [];
        const loaded: ChatMessage[] = rows.map((row) => ({
          id: `db-${row.id}`,
          role: row.role.toLowerCase() as "user" | "assistant",
          content: row.content,
          creditsUsed: row.credits_used,
          timestamp: new Date(row.created_at),
        }));
        setMessages(loaded);
      })
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setIsLoadingHistory(false));
  }, [projectId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      try {
        abortRef.current = new AbortController();
        const token = Cookies.get("access_token");

        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            project_id: Number(projectId),
            messages: [{ role: "user", content }],
          }),
          signal: abortRef.current.signal,
        });

        if (response.status === 402) {
          onError?.("You've run out of credits. Upgrade your plan to continue.");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setIsStreaming(false);
          return;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error?.message || "Chat request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          // Process SSE lines — handle event:/data: pairs
          let pendingEventType: string | null = null;

          for (let li = 0; li < lines.length; li++) {
            const line = lines[li];

            // Collect event type for next data line
            if (line.startsWith("event:")) {
              pendingEventType = line.slice(6).trim();
              continue;
            }

            if (line.startsWith("data:")) {
              const rawData = line.slice(5).trim();
              const eventType = pendingEventType;
              pendingEventType = null; // consume it

              if (rawData === "[DONE]") {
                setIsExecuting(false);
                continue;
              }

              // If we have an event type, parse as structured event
              if (eventType) {
                try {
                  const parsed = JSON.parse(rawData);
                  if (eventType === "command_exec") {
                    setIsExecuting(true);
                    setBuildProgress({ completed: parsed.index || 0, total: parsed.total || 1 });
                    setRunningCommand({ label: parsed.label, command: parsed.command, output: [], index: parsed.index, total: parsed.total });
                    onCommandExec?.(parsed.command, parsed.label, parsed.index, parsed.total);
                  } else if (eventType === "command_start") {
                    setIsExecuting(true);
                    setRunningCommand({ label: parsed.label, command: parsed.command, output: [], index: parsed.index, total: parsed.total });
                    setBuildProgress({ completed: parsed.index || 0, total: parsed.total || 1 });
                  } else if (eventType === "command_output" || eventType === "command_error_line") {
                    setRunningCommand((prev) =>
                      prev ? { ...prev, output: [...prev.output.slice(-50), parsed.line] } : null
                    );
                  } else if (eventType === "command_done") {
                    setRunningCommand(null);
                    setBuildProgress((prev) => prev ? { ...prev, completed: (prev.completed || 0) + 1 } : null);
                  } else if (eventType === "command_failed") {
                    setRunningCommand(null);
                  } else if (eventType === "preview_ready") {
                    setPreviewUrl(parsed.url);
                  } else if (eventType === "build_complete") {
                    setIsExecuting(false);
                    setRunningCommand(null);
                    setBuildProgress(null);
                    if (parsed.preview_url) setPreviewUrl(parsed.preview_url);
                  } else if (eventType === "file_write") {
                    onFileWrite?.(parsed.path, parsed.content);
                  } else if (eventType === "credits") {
                    setCreditsRemaining(parsed.remaining);
                    onCreditsUpdate?.(parsed.used, parsed.remaining);
                  } else if (eventType === "message") {
                    // AI text chunk
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: m.content + (typeof parsed === "string" ? parsed : rawData) }
                          : m
                      )
                    );
                  }
                } catch {
                  // JSON parse failed for typed event — treat message events as text
                  if (eventType === "message") {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: m.content + rawData }
                          : m
                      )
                    );
                  }
                }
                continue;
              }

              // No event type — handle as raw data (credits or text chunk)
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.used !== undefined && parsed.remaining !== undefined) {
                  setCreditsRemaining(parsed.remaining);
                  onCreditsUpdate?.(parsed.used, parsed.remaining);
                  continue;
                }
              } catch {
                // not JSON
              }

              // Plain text chunk — append to assistant message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + rawData }
                    : m
                )
              );
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Chat failed";
        onError?.(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [projectId, onCreditsUpdate, onError]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    isStreaming,
    isLoadingHistory,
    isExecuting,
    runningCommand,
    buildProgress,
    previewUrl,
    stopStreaming,
    creditsRemaining,
  };
}
