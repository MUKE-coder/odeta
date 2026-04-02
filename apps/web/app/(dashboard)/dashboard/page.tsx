"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, FolderOpen, Coins } from "lucide-react";

interface Project {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  github_repo_url: string;
  subdomain: string;
  updated_at: string;
}

interface ProjectsResponse {
  data: Project[];
  total: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/projects");
      return data as ProjectsResponse;
    },
  });

  const projects = data?.data || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your projects and build new apps
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-bg-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <FolderOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-text-secondary">Projects</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-bg-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Coins className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.credits ?? 0}</p>
              <p className="text-xs text-text-secondary">Credits remaining</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-bg-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{user?.plan ?? "free"}</p>
              <p className="text-xs text-text-secondary">Current plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-bg-secondary/50 p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
            Start building your first app. Describe what you want and Odeta will
            create a build plan using Grit + JB commands.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
