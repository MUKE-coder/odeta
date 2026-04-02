"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getPendingPrompt, clearPendingPrompt } from "@/lib/pending-prompt";
import { PresetPrompts } from "@/components/new-project/preset-prompts";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"WEB_APP" | "WEBSITE">("WEB_APP");
  const [isLoading, setIsLoading] = useState(false);
  const autoSubmitted = useRef(false);

  // Load from URL params or localStorage
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    const urlType = searchParams.get("type");

    if (urlPrompt) {
      setPrompt(urlPrompt);
      if (urlType === "WEBSITE" || urlType === "WEB_APP") setType(urlType);
      return;
    }

    const pending = getPendingPrompt();
    if (pending && !autoSubmitted.current) {
      setPrompt(pending.prompt);
      setType(pending.type);
      clearPendingPrompt();
      // Auto-submit after a brief delay
      autoSubmitted.current = true;
      setTimeout(() => {
        handleSubmit(pending.prompt, pending.type);
      }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(p?: string, t?: "WEB_APP" | "WEBSITE") {
    const finalPrompt = p || prompt;
    const finalType = t || type;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    try {
      const slug = finalPrompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 30);

      const name =
        finalPrompt.length > 50
          ? finalPrompt.slice(0, 50) + "..."
          : finalPrompt;

      const { data: res } = await apiClient.post("/api/projects", {
        name,
        slug: slug || "my-project",
        type: finalType,
        description: finalPrompt,
      });

      const projectId = res.data?.id;
      if (projectId) {
        toast.success("Project created!");
        router.push(`/dashboard/chat/${projectId}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          What will you build?
        </h1>
        <p className="mt-3 text-text-secondary">
          Next.js fullstack apps built with proven component commands — not hallucinated boilerplate.
        </p>

        {/* Preset prompts — shown when empty */}
        {!prompt.trim() && (
          <div className="mt-8">
            <PresetPrompts
              onSelect={(p, t) => {
                setPrompt(p);
                setType(t);
              }}
            />
          </div>
        )}

        {/* Prompt input */}
        <div className={prompt.trim() ? "mt-8" : "mt-2"}>
          <div className="rounded-2xl border border-border-strong bg-white p-1 shadow-sm">
            <div className="flex items-end">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your idea..."
                rows={3}
                className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!prompt.trim() || isLoading}
                className="m-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover disabled:opacity-30 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Type pills */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setType("WEB_APP")}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                type === "WEB_APP"
                  ? "border-accent bg-accent-light text-accent font-medium"
                  : "border-border bg-white text-text-secondary hover:border-border-strong"
              }`}
            >
              ⚡ Web App
            </button>
            <button
              onClick={() => setType("WEBSITE")}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                type === "WEBSITE"
                  ? "border-accent bg-accent-light text-accent font-medium"
                  : "border-border bg-white text-text-secondary hover:border-border-strong"
              }`}
            >
              🌐 Website
            </button>
          </div>

          <p className="mt-3 text-xs text-text-tertiary">
            Web App = Next.js fullstack with API routes · Website = Next.js static ·
            1 credit per AI message
          </p>
        </div>
      </div>
    </div>
  );
}
