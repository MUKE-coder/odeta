"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowRight, Download, Loader2 } from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
  github_repo_url?: string;
}

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await apiClient.get(`/api/projects/${project.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Project downloaded");
    } catch {
      toast.error("Download not available yet");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-text-secondary border rounded-lg hover:bg-surface transition-colors"
        title="Download project"
      >
        {downloading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">Download</span>
      </button>

      <button
        disabled={project.status !== "READY"}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors",
          project.status === "READY"
            ? "bg-foreground text-white hover:opacity-90"
            : "bg-gray-100 text-text-tertiary cursor-not-allowed"
        )}
        title={project.status !== "READY" ? "Build your project first" : "Deploy to production"}
      >
        Publish
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
