"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  path: string;
  content: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

function detectLanguage(path: string): string {
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".go")) return "go";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".sh")) return "shell";
  return "plaintext";
}

export function CodeEditor({
  path,
  content,
  language,
  readOnly = true,
  onChange,
}: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  return (
    <div className="h-full">
      <Editor
        key={path}
        height="100%"
        path={path}
        defaultValue={content}
        language={language || detectLanguage(path)}
        theme="vs-light"
        onChange={(value) => onChange?.(value || "")}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          readOnly,
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerBorder: false,
          renderLineHighlight: "line",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
