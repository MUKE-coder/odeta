"use client";

import { Loader2, Eye, RefreshCw, ExternalLink } from "lucide-react";

interface WebContainerPreviewProps {
  previewUrl: string | null;
  isBooting: boolean;
  isInstalling: boolean;
}

export function WebContainerPreview({
  previewUrl,
  isBooting,
  isInstalling,
}: WebContainerPreviewProps) {
  if (isBooting) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Starting WebContainer...</p>
          <p className="text-xs text-gray-400 mt-1">This takes a few seconds on first load</p>
        </div>
      </div>
    );
  }

  if (isInstalling) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Installing dependencies...</p>
          <p className="text-xs text-gray-400 mt-1">Running pnpm install + starting dev server</p>
        </div>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Your app preview will appear here as it&apos;s built</p>
          <p className="text-xs text-gray-400 mt-1">The AI will generate your project files first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono truncate flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="truncate">{previewUrl}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => {
              const iframe = document.querySelector<HTMLIFrameElement>("#wc-preview");
              if (iframe) iframe.src = previewUrl;
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Preview iframe */}
      <iframe
        id="wc-preview"
        src={previewUrl}
        className="w-full border-none"
        style={{ height: "calc(100% - 36px)" }}
        title="App preview"
        allow="cross-origin-isolated"
      />
    </div>
  );
}
