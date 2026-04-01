"use client";

import { useState, useCallback, useRef } from "react";
import { getAccessToken } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  creditsUsed?: number;
  timestamp: Date;
}

interface UseChatOptions {
  projectId: number;
  onCreditsUpdate?: (used: number, remaining: number) => void;
  onError?: (error: string) => void;
}

export function useOdetaChat({ projectId, onCreditsUpdate, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
        const token = getAccessToken();

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

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.slice(5).trim();

              // Check for event type prefix
              if (line.startsWith("event:")) continue;

              // Parse SSE events
              if (data === "[DONE]") continue;

              // Try to parse as credits update
              try {
                const parsed = JSON.parse(data);
                if (parsed.used !== undefined && parsed.remaining !== undefined) {
                  setCreditsRemaining(parsed.remaining);
                  onCreditsUpdate?.(parsed.used, parsed.remaining);
                  continue;
                }
              } catch {
                // Not JSON — treat as text chunk
              }

              // Append text chunk to assistant message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data }
                    : m
                )
              );
            }

            // Handle event: message format
            if (line.startsWith("event: message")) {
              // Next data line will be the content
              continue;
            }

            if (line.startsWith("event: credits")) {
              // Next data line will be credits JSON
              continue;
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
    stopStreaming,
    creditsRemaining,
  };
}
