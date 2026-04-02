"use client";

import { useState } from "react";
import { FileTree, type FileNode } from "./file-tree";
import { TabsBar } from "./tabs-bar";
import { CodeEditor } from "./code-editor";
import { Code } from "lucide-react";

// Demo file tree for placeholder
const DEMO_FILES: FileNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        name: "app",
        path: "src/app",
        type: "folder",
        children: [
          { name: "page.tsx", path: "src/app/page.tsx", type: "file" },
          { name: "layout.tsx", path: "src/app/layout.tsx", type: "file" },
          { name: "globals.css", path: "src/app/globals.css", type: "file" },
        ],
      },
      {
        name: "components",
        path: "src/components",
        type: "folder",
        children: [
          { name: "navbar.tsx", path: "src/components/navbar.tsx", type: "file" },
        ],
      },
    ],
  },
];

interface EditorPanelProps {
  files?: FileNode[];
  fileContents?: Record<string, string>;
}

export function EditorPanel({ files, fileContents }: EditorPanelProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<{ path: string; name: string }[]>([]);

  const displayFiles = files && files.length > 0 ? files : null;

  function handleSelectFile(path: string) {
    setSelectedPath(path);
    if (!openTabs.find((t) => t.path === path)) {
      const name = path.split("/").pop() || path;
      setOpenTabs((prev) => [...prev, { path, name }]);
    }
  }

  function handleCloseTab(path: string) {
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    if (selectedPath === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      setSelectedPath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }

  const currentContent = selectedPath && fileContents ? fileContents[selectedPath] : null;

  if (!displayFiles) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface h-full">
        <div className="text-center px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border">
            <Code className="h-5 w-5 text-text-tertiary" />
          </div>
          <p className="text-sm text-text-secondary">
            Generated code will appear here as your project is built
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-52 border-r bg-white flex-shrink-0 overflow-hidden">
        <FileTree
          files={displayFiles}
          selectedPath={selectedPath}
          onSelectFile={handleSelectFile}
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TabsBar
          tabs={openTabs}
          activeTab={selectedPath}
          onSelect={setSelectedPath}
          onClose={handleCloseTab}
        />

        {selectedPath && currentContent !== undefined && currentContent !== null ? (
          <CodeEditor
            path={selectedPath}
            content={currentContent}
            language=""
            readOnly
          />
        ) : selectedPath ? (
          <div className="flex-1 flex items-center justify-center bg-surface">
            <p className="text-xs text-text-tertiary">File content not available yet</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-surface">
            <p className="text-xs text-text-tertiary">Select a file to view</p>
          </div>
        )}

        {/* Status bar */}
        {selectedPath && (
          <div className="flex items-center justify-between px-3 py-1 border-t bg-gray-50 text-[10px] text-text-tertiary">
            <span>{selectedPath}</span>
            <span>Read-only</span>
          </div>
        )}
      </div>
    </div>
  );
}
