"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, Coins, Zap } from "lucide-react";

interface Project {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/projects");
      return data;
    },
  });

  const projects: Project[] = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your projects and build new apps
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-light p-2">
              <FolderOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{projects.length}</p>
              <p className="text-xs text-text-secondary">Projects</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <Coins className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{user?.credits ?? 0}</p>
              <p className="text-xs text-text-secondary">Credits remaining</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground capitalize">{user?.plan ?? "free"}</p>
              <p className="text-xs text-text-secondary">Current plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No projects yet</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
            Describe what you want to build and Odeta will create it using Grit + JB commands.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/chat/${project.id}`}
              className="rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground truncate pr-2">{project.name}</h3>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-text-secondary">
                  {project.type === "WEB_APP" ? "Web App" : "Website"}
                </span>
              </div>
              {project.description && (
                <p className="mt-2 text-sm text-text-secondary line-clamp-2">{project.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  project.status === "READY" ? "bg-success" :
                  project.status === "BUILDING" ? "bg-warning" :
                  "bg-text-tertiary"
                }`} />
                <span className="text-xs text-text-tertiary capitalize">{project.status.toLowerCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
