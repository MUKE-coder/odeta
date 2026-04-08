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

        const data = await response.json();

        // Add AI response
        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.content || "",
          timestamp: new Date(),
          creditsUsed: data.credits_used,
          files: data.files,
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Update credits
        if (data.credits_remaining !== undefined) {
          setCreditsRemaining(data.credits_remaining);
          onCreditsUpdate?.(data.credits_used || 1, data.credits_remaining);
        }

        // Notify about generated files
        if (data.files && data.files.length > 0) {
          onFilesGenerated?.(data.files);
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
