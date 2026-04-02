"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, File, Folder } from "lucide-react";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

function getFileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "text-blue-500";
  if (name.endsWith(".go")) return "text-cyan-500";
  if (name.endsWith(".css")) return "text-pink-500";
  if (name.endsWith(".json")) return "text-yellow-500";
  if (name.endsWith(".md")) return "text-gray-500";
  return "text-gray-400";
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isExpanded = expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-[3px] cursor-pointer text-[11px] transition-colors",
          "hover:bg-gray-100",
          isSelected && "bg-blue-50 text-blue-700"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => (isFolder ? onToggle(node.path) : onSelect(node.path))}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                "w-3 h-3 text-gray-400 transition-transform flex-shrink-0",
                isExpanded && "rotate-90"
              )}
            />
            <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            <File className={cn("w-3.5 h-3.5 flex-shrink-0", getFileIcon(node.name))} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder &&
        isExpanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTree({ files, selectedPath, onSelectFile }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["src", "src/app", "src/components"])
  );

  function toggleFolder(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  return (
    <div className="h-full overflow-y-auto select-none">
      <div className="px-3 py-2 border-b">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Explorer
        </span>
      </div>
      <div className="py-1">
        {files.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            expanded={expanded}
            onToggle={toggleFolder}
            selectedPath={selectedPath}
            onSelect={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
}
