"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2, RefreshCw, ExternalLink, AlertCircle, Play, Server } from "lucide-react";
import { compileProject } from "@/lib/sandbox/compiler";
import { FileSystem } from "@/lib/sandbox/file-system";
import Cookies from "js-cookie";

interface SandboxPreviewProps {
  files: Record<string, string>;
  projectId?: string;
}

export function SandboxPreview({ files, projectId }: SandboxPreviewProps) {
  const [compiledHtml, setCompiledHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompiled, setLastCompiled] = useState<Date | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Server-side run state
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [showServer, setShowServer] = useState(false);

  const runOnServer = async () => {
    if (!projectId) return;
    setIsStarting(true);
    setServerLogs([]);
    setShowServer(true);

    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`/api/projects/${projectId}/run`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setServerLogs((prev) => [...prev, `Error: ${err?.error?.message || res.statusText}`]);
        setIsStarting(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "log" || parsed.type === "error") {
              setServerLogs((prev) => [...prev.slice(-100), String(parsed.data)]);
            }
            if (parsed.type === "status") {
              setServerLogs((prev) => [...prev, String(parsed.data)]);
            }
            if (parsed.type === "ready" && parsed.data?.preview_url) {
              setServerUrl(parsed.data.preview_url);
              setIsStarting(false);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setServerLogs((prev) => [...prev, `Failed: ${err instanceof Error ? err.message : "unknown"}`]);
    } finally {
      setIsStarting(false);
    }
  };

  const compile = async () => {
    if (Object.keys(files).length === 0) return;
    setIsCompiling(true);
    setError(null);

    try {
      // Remap paths: AI generates src/app/page.tsx but compiler expects app/page.tsx
      const remapped: Record<string, string> = {};
      for (const [path, content] of Object.entries(files)) {
        const cleanPath = path.replace(/^src\//, "");
        remapped[cleanPath] = content;
      }

      const fs = new FileSystem(remapped);
      const result = await compileProject(fs);
      setCompiledHtml(result);
      setLastCompiled(new Date());
      setIframeKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed");
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    compile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const openInNewTab = () => {
    const blob = new Blob([compiledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  if (Object.keys(files).length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center px-6">
          <Globe className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Your app preview will appear here</p>
        </div>
      </div>
    );
  }

  if (isCompiling) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Compiling preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-red-50">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-medium text-red-700">Preview Error</span>
          <button
            onClick={compile}
            className="ml-auto text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <pre className="text-xs font-mono text-red-600 whitespace-pre-wrap">{error}</pre>
        </div>
      </div>
    );
  }

  // If server is running, show server preview
  if (showServer && serverUrl) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700">Live Server</span>
            <span className="text-[10px] text-gray-400 font-mono">{serverUrl}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowServer(false)} className="px-2 py-0.5 text-[10px] text-gray-500 border rounded hover:bg-gray-100">
              Sandbox
            </button>
            <button onClick={() => setIframeKey(k => k + 1)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a href={serverUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe key={iframeKey} src={serverUrl} className="w-full h-full border-0" title="Live Server Preview" />
        </div>
      </div>
    );
  }

  // If server is starting, show logs
  if (showServer && isStarting) {
    return (
      <div className="flex flex-col h-full bg-gray-950 text-gray-100 font-mono">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400">Starting server...</span>
          </div>
          <button onClick={() => { setShowServer(false); setIsStarting(false); }} className="text-[10px] text-gray-500 hover:text-gray-300">
            Cancel
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-0.5">
          {serverLogs.map((line, i) => (
            <div key={i} className="text-gray-400">{line}</div>
          ))}
          <div className="w-2 h-3 bg-green-400 animate-pulse inline-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-gray-600">Preview</span>
          {lastCompiled && (
            <span className="text-[10px] text-gray-400">
              {lastCompiled.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {projectId && Object.keys(files).length > 0 && (
            <button
              onClick={runOnServer}
              disabled={isStarting}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
              title="Run with real server (API routes + database)"
            >
              <Play className="w-3 h-3" />
              Run Server
            </button>
          )}
          <button onClick={openInNewTab} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Open in new tab">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button onClick={compile} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe with compiled HTML */}
      <div className="flex-1 min-h-0">
        <iframe
          key={iframeKey}
          srcDoc={compiledHtml}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
