"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export interface TerminalLine {
  content: string;
  type: "output" | "error" | "system";
  timestamp: Date;
}

export type ContainerStatus = "idle" | "booting" | "ready" | "running" | "error";

export function useWebContainer() {
  const containerRef = useRef<WebContainer | null>(null);
  const [status, setStatus] = useState<ContainerStatus>("idle");
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [currentProcess, setCurrentProcess] = useState<string | null>(null);

  const addLine = useCallback(
    (content: string, type: TerminalLine["type"] = "output") => {
      setTerminalLines((prev) => [
        ...prev.slice(-500),
        { content, type, timestamp: new Date() },
      ]);
    },
    []
  );

  const boot = useCallback(async () => {
    if (containerRef.current || status === "booting") return;
    setStatus("booting");
    addLine("Starting WebContainer...", "system");

    try {
      const container = await WebContainer.boot();
      containerRef.current = container;

      container.on("server-ready", (_port: number, url: string) => {
        addLine(`Dev server ready at ${url}`, "system");
        setPreviewUrl(url);
      });

      setStatus("ready");
      addLine("WebContainer ready", "system");
      return container;
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLine(`Failed to start: ${msg}`, "error");
      throw err;
    }
  }, [status, addLine]);

  const writeFile = useCallback(
    async (path: string, content: string) => {
      if (!containerRef.current) throw new Error("Container not ready");
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir) {
        await containerRef.current.fs.mkdir(dir, { recursive: true });
      }
      await containerRef.current.fs.writeFile(path, content);
      addLine(`  created ${path}`, "output");
      setFiles((prev) => [...prev.filter((f) => f !== path), path]);
    },
    [addLine]
  );

  const readFile = useCallback(async (path: string): Promise<string> => {
    if (!containerRef.current) throw new Error("Container not ready");
    return await containerRef.current.fs.readFile(path, "utf-8");
  }, []);

  const runCommand = useCallback(
    async (
      command: string,
      label?: string,
      onLine?: (line: string, isErr: boolean) => void
    ): Promise<number> => {
      if (!containerRef.current) throw new Error("Container not ready");
      const displayLabel = label || command;
      addLine(`\n$ ${command}`, "system");
      setCurrentProcess(displayLabel);
      setStatus("running");

      const parts = command.trim().split(/\s+/);
      const process = await containerRef.current.spawn(parts[0], parts.slice(1));

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            const lines = data.split("\n").filter(Boolean);
            lines.forEach((line) => {
              addLine(line, "output");
              onLine?.(line, false);
            });
          },
        })
      );

      const exitCode = await process.exit;
      setCurrentProcess(null);
      setStatus("ready");

      if (exitCode === 0) {
        addLine(`${displayLabel} complete`, "system");
      } else {
        addLine(`${displayLabel} failed (exit ${exitCode})`, "error");
      }

      return exitCode;
    },
    [addLine]
  );

  const startDevServer = useCallback(async () => {
    if (!containerRef.current) return;
    addLine("\n$ pnpm dev", "system");
    setCurrentProcess("Starting dev server...");
    setStatus("running");

    const process = await containerRef.current.spawn("pnpm", ["dev"]);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          const lines = data.split("\n").filter(Boolean);
          lines.forEach((line) => addLine(line, "output"));
        },
      })
    );

    // Don't await — dev server runs forever
    return process;
  }, [addLine]);

  useEffect(() => {
    return () => {
      containerRef.current?.teardown();
    };
  }, []);

  return {
    boot,
    writeFile,
    readFile,
    runCommand,
    startDevServer,
    status,
    terminalLines,
    previewUrl,
    files,
    currentProcess,
  };
}
