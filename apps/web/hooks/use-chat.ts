"use client";

import { useState, useCallback, useEffect } from "react";
import Cookies from "js-cookie";

const API_URL = "";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
  timestamp: Date;
  files?: string[];
}

interface UseChatOptions {
  projectId: string | number;
  onCreditsUpdate?: (used: number, remaining: number) => void;
  onError?: (error: string) => void;
  onFilesGenerated?: (files: string[]) => void;
}

interface ConversationRow {
  id: number;
  role: string;
  content: string;
  created_at: string;
  credits_used: number;
}

export function useOdetaChat({
  projectId,
  onCreditsUpdate,
  onError,
  onFilesGenerated,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    if (!projectId || projectId === "placeholder") return;
    setIsLoadingHistory(true);

    const token = Cookies.get("access_token");
    fetch(`${API_URL}/api/projects/${projectId}/conversations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        const rows: ConversationRow[] = Array.isArray(data) ? data : data?.data || [];
        const loaded: ChatMessage[] = rows.map((row) => ({
          id: String(row.id),
          role: row.role.toLowerCase() as "user" | "assistant",
          content: row.content,
          timestamp: new Date(row.created_at),
          creditsUsed: row.credits_used,
        }));
        setMessages(loaded);
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, [projectId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      const assistantId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        userMsg,
        // Add empty assistant message that will be filled by streaming
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ]);
      setIsStreaming(true);

      try {
        const token = Cookies.get("access_token");

        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            project_id: projectId,
            messages: [{ role: "user", content }],
          }),
        });

        if (response.status === 402) {
          onError?.("You've run out of credits. Upgrade your plan to continue.");
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== assistantId));
          return;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Request failed (${response.status})`);
        }

        // Stream NDJSON — read line by line as they arrive
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let streamedContent = "";
        let finalFiles: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on newlines — each line is a JSON object
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);

              if (parsed.error) {
                throw new Error(parsed.error.message || "AI error");
              }

              if (parsed.chunk) {
                // Append chunk to the streaming message
                streamedContent += parsed.chunk;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              }

              if (parsed.done) {
                // Final message — update with complete content and files
                const finalContent = (parsed.content as string) || streamedContent;
                finalFiles = (parsed.files as string[]) || [];

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: finalContent, files: finalFiles, creditsUsed: parsed.credits_used }
                      : m
                  )
                );

                if (parsed.credits_remaining !== undefined) {
                  setCreditsRemaining(parsed.credits_remaining);
                  onCreditsUpdate?.(parsed.credits_used || 1, parsed.credits_remaining);
                }
              }
            } catch (e) {
              // Skip malformed JSON lines (keepalive spaces, etc.)
              if (e instanceof Error && e.message.includes("AI error")) throw e;
            }
          }
        }

        // Notify about generated files after stream ends
        if (finalFiles.length > 0) {
          onFilesGenerated?.(finalFiles);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chat failed";
        onError?.(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [projectId, isStreaming, onCreditsUpdate, onError, onFilesGenerated]
  );

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    isExecuting: false,
    runningCommand: null,
    buildProgress: null,
    creditsRemaining,
    sendMessage,
    setMessages,
  };
}
