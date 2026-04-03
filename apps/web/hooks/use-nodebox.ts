"use client";

import { useCallback, useRef, useState } from "react";

export type NodeboxStatus = "idle" | "connecting" | "ready" | "running" | "error";

export function useNodebox() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtimeRef = useRef<any>(null);
  const [status, setStatus] = useState<NodeboxStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const connect = useCallback(async (iframe: HTMLIFrameElement) => {
    if (runtimeRef.current) return;
    setStatus("connecting");
    try {
      const { Nodebox } = await import("@codesandbox/nodebox");
      const runtime = new Nodebox({ iframe });
      await runtime.connect();
      runtimeRef.current = runtime;
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      console.error("[Nodebox] Failed to connect:", err);
    }
  }, []);

  const initFiles = useCallback(
    async (files: Record<string, string>) => {
      if (!runtimeRef.current) return;
      // Convert string map to Nodebox file tree format
      const fileTree: Record<string, { file: { contents: string } }> = {};
      for (const [path, content] of Object.entries(files)) {
        fileTree[path] = { file: { contents: content } };
      }
      await runtimeRef.current.fs.init(fileTree);
    },
    []
  );

  const startDevServer = useCallback(
    async (previewIframe: HTMLIFrameElement) => {
      if (!runtimeRef.current) return null;
      setStatus("running");
      try {
        const shell = runtimeRef.current.shell.create();
        const process = await shell.runCommand("npx", ["next", "dev"]);
        const preview = await runtimeRef.current.preview.getByShellId(
          process.id
        );
        setPreviewUrl(preview.url);
        previewIframe.src = preview.url;
        return preview.url;
      } catch (err) {
        console.error("[Nodebox] Dev server failed:", err);
        setStatus("error");
        return null;
      }
    },
    []
  );

  return {
    connect,
    initFiles,
    startDevServer,
    status,
    previewUrl,
    isReady: status === "ready" || status === "running",
  };
}
