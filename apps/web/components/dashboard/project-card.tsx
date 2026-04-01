"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, MoreVertical, MessageSquare, Trash2 } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    slug: string;
    type: string;
    status: string;
    description?: string;
    github_repo_url?: string;
    subdomain?: string;
    updated_at: string;
  };
  onDelete?: (id: number) => void;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  BUILDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  BUILT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DEPLOYED: "bg-green-500/10 text-green-500 border-green-500/20",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
  PAUSED: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  WEB_APP: "Web App",
  WEBSITE: "Website",
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const liveUrl = project.subdomain
    ? `https://${project.subdomain}.odeta.app`
    : null;

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/chat/${project.id}`}
            className="font-semibold hover:text-primary transition-colors truncate block"
          >
            {project.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {project.slug}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/chat/${project.id}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Open
              </Link>
            </DropdownMenuItem>
            {project.github_repo_url && (
              <DropdownMenuItem asChild>
                <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </DropdownMenuItem>
            )}
            {liveUrl && (
              <DropdownMenuItem asChild>
                <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Live Site
                </a>
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {typeLabels[project.type] || project.type}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs ${statusColors[project.status] || ""}`}
        >
          {project.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </span>
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Live
          </a>
        )}
      </div>
    </div>
  );
}
