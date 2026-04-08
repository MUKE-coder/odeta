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
  const [isLoading, setIsLoading] = useState(false);
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
      .catch(() => {
        // Silently fail — empty chat is fine
      })
      .finally(() => setIsLoadingHistory(false));
  }, [projectId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

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
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
          return;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Request failed (${response.status})`);
        }

        // Parse NDJSON stream — read line by line, use the last "done" line
        const text = await response.text();
        const lines = text.trim().split("\n").filter(Boolean);

        let finalData: Record<string, unknown> | null = null;
        let streamedContent = "";

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) {
              throw new Error(parsed.error.message || "AI error");
            }
            if (parsed.done) {
              finalData = parsed;
            } else if (parsed.chunk) {
              streamedContent += parsed.chunk;
            }
          } catch {
            // skip malformed lines
          }
        }

        const aiContent = (finalData?.content as string) || streamedContent || "";
        const aiFiles = (finalData?.files as string[]) || [];

        // Add AI response
        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
          creditsUsed: (finalData?.credits_used as number) || 1,
          files: aiFiles,
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Update credits
        if (finalData?.credits_remaining !== undefined) {
          setCreditsRemaining(finalData.credits_remaining as number);
          onCreditsUpdate?.((finalData.credits_used as number) || 1, finalData.credits_remaining as number);
        }

        // Notify about generated files
        if (aiFiles.length > 0) {
          onFilesGenerated?.(aiFiles);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chat failed";
        onError?.(message);
        // Remove user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, isLoading, onCreditsUpdate, onError, onFilesGenerated]
  );

  return {
    messages,
    isStreaming: isLoading, // keep same name for UI compat
    isLoadingHistory,
    isExecuting: false,
    runningCommand: null,
    buildProgress: null,
    creditsRemaining,
    sendMessage,
    setMessages,
  };
}
