"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Loader2, ExternalLink, AlertTriangle,
} from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import Link from "next/link";

interface Project {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  github_repo_url: string;
  subdomain: string;
  custom_domain: string;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawId = params.id as string;
  const projectId = Number(
    rawId === "placeholder"
      ? (typeof window !== "undefined" ? window.location.pathname.split("/projects/")[1]?.split("/")[0] : "0")
      : rawId
  );

  const { data, isLoading } = useQuery<{ data: Project }>({
    queryKey: ["project", projectId],
    queryFn: async () => { const { data } = await apiClient.get(`/api/projects/${projectId}`); return data; },
  });

  const project = data?.data;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialize form values when data loads
  if (project && !name && !description) {
    setName(project.name);
    setDescription(project.description || "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.put(`/api/projects/${projectId}`, { name, description });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/projects/${projectId}`);
      toast.success("Project deleted");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl max-w-2xl" />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/dashboard/chat/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Project Settings</h1>
          <p className="text-sm text-muted-foreground">{project.slug}</p>
        </div>
      </div>

      {/* General */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="font-semibold">General</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">{project.type === "WEB_APP" ? "Web App" : "Website"}</Badge>
          <Badge variant="outline" className="capitalize">{project.status.toLowerCase()}</Badge>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Links */}
      <div className="rounded-xl border border-border/60 bg-card p-6 mt-4 space-y-3">
        <h2 className="font-semibold">Links</h2>

        {project.github_repo_url && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4" />
              <span>GitHub Repository</span>
            </div>
            <a
              href={project.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {project.subdomain && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4" />
              <span>Live URL</span>
            </div>
            <a
              href={`https://${project.subdomain}.odeta.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {project.subdomain}.odeta.app
            </a>
          </div>
        )}

        {!project.github_repo_url && !project.subdomain && (
          <p className="text-sm text-muted-foreground">
            No links yet. Generate and deploy your project to see links here.
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <Separator className="my-6" />
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this project and all its data. This cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Delete Project
        </Button>
      </div>
    </div>
  );
}
