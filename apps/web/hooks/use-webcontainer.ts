"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

export type ContainerStatus = "idle" | "booting" | "ready" | "error";

export interface TerminalLine {
  content: string;
  type: "output" | "error" | "system";
}

let _instance: WebContainer | null = null;
let _bootPromise: Promise<WebContainer> | null = null;

export function useWebContainer() {
  const [status, setStatus] = useState<ContainerStatus>(
    _instance ? "ready" : "idle"
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const containerRef = useRef<WebContainer | null>(_instance);

  const addLine = useCallback(
    (content: string, type: TerminalLine["type"] = "output") => {
      setTerminalLines((prev) => [
        ...prev.slice(-300),
        { content, type },
      ]);
    },
    []
  );

  // Boot — singleton, only one WebContainer per page
  const boot = useCallback(async () => {
    if (containerRef.current) {
      setStatus("ready");
      return containerRef.current;
    }

    if (_bootPromise) {
      const wc = await _bootPromise;
      containerRef.current = wc;
      setStatus("ready");
      return wc;
    }

    setStatus("booting");
    addLine("Starting WebContainer...", "system");

    _bootPromise = WebContainer.boot();

    try {
      const wc = await _bootPromise;
      _instance = wc;
      containerRef.current = wc;

      // Listen for server-ready (when dev server starts)
      wc.on("server-ready", (_port: number, url: string) => {
        addLine(`Dev server ready: ${url}`, "system");
        setPreviewUrl(url);
      });

      setStatus("ready");
      addLine("WebContainer ready", "system");
      return wc;
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Boot failed";
      addLine(`Error: ${msg}`, "error");
      _bootPromise = null;
      throw err;
    }
  }, [addLine]);

  // Write a single file
  const writeFile = useCallback(
    async (path: string, content: string) => {
      const wc = containerRef.current;
      if (!wc) return;

      // Create parent dirs
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir) {
        await wc.fs.mkdir(dir, { recursive: true });
      }
      await wc.fs.writeFile(path, content);
    },
    []
  );

  // Write multiple files at once
  const writeFiles = useCallback(
    async (files: Record<string, string>) => {
      const wc = containerRef.current;
      if (!wc) return;

      addLine(`Writing ${Object.keys(files).length} files...`, "system");

      for (const [path, content] of Object.entries(files)) {
        const dir = path.split("/").slice(0, -1).join("/");
        if (dir) {
          await wc.fs.mkdir(dir, { recursive: true });
        }
        await wc.fs.writeFile(path, content);
      }

      addLine(
        `Wrote ${Object.keys(files).length} files`,
        "system"
      );
    },
    [addLine]
  );

  // Run a shell command
  const runCommand = useCallback(
    async (command: string, label?: string) => {
      const wc = containerRef.current;
      if (!wc) return 1;

      addLine(`$ ${command}`, "system");

      const process = await wc.spawn("jsh", ["-c", command]);

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            const lines = data.split("\n").filter(Boolean);
            for (const line of lines) {
              addLine(line, "output");
            }
          },
        })
      );

      const exitCode = await process.exit;

      if (exitCode === 0) {
        addLine(`${label || command} done`, "system");
      } else {
        addLine(`${label || command} failed (exit ${exitCode})`, "error");
      }

      return exitCode;
    },
    [addLine]
  );

  // Install deps and start dev server
  const installAndStart = useCallback(async () => {
    const wc = containerRef.current;
    if (!wc) return;

    addLine("Installing dependencies...", "system");
    await runCommand("pnpm install", "pnpm install");

    addLine("Starting dev server...", "system");
    const devProcess = await wc.spawn("pnpm", ["dev"]);

    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          const lines = data.split("\n").filter(Boolean);
          for (const line of lines) {
            addLine(line, "output");
          }
        },
      })
    );

    // Don't await — dev server runs forever
  }, [addLine, runCommand]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      // Don't teardown — keep singleton alive for tab switches
    };
  }, []);

  return {
    boot,
    writeFile,
    writeFiles,
    runCommand,
    installAndStart,
    status,
    previewUrl,
    terminalLines,
    addLine,
    isReady: status === "ready",
  };
}
