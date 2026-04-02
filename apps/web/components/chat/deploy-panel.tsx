"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Rocket, CheckCircle, XCircle, Loader2, ExternalLink,
  AlertTriangle, Lock,
} from "lucide-react";
import Link from "next/link";

interface DeployPanelProps {
  projectId: number;
  projectSlug: string;
  projectStatus: string;
  githubRepoUrl?: string;
}

interface Deployment {
  id: number;
  status: string;
  subdomain: string;
  deployed_at: string | null;
  created_at: string;
}

export function DeployPanel({
  projectId,
  projectSlug,
  projectStatus,
  githubRepoUrl,
}: DeployPanelProps) {
  const { user } = useAuth();
  const [subdomain, setSubdomain] = useState(projectSlug);
  const [deploying, setDeploying] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const isFree = user?.plan === "free";

  const { data: deploymentsData, refetch: refetchDeployments } = useQuery<{
    data: Deployment[];
  }>({
    queryKey: ["deployments", projectId],
    queryFn: async () => { const { data } = await apiClient.get(`/api/projects/${projectId}/deployments`); return data; },
  });

  const deployments = deploymentsData?.data || [];
  const latestDeployment = deployments[0];
  const isLive = latestDeployment?.status === "LIVE";

  async function checkSubdomain() {
    if (!subdomain.trim()) return;
    setCheckingSubdomain(true);
    try {
      const res = await apiClient.get(
        `/api/subdomains/check?name=${encodeURIComponent(subdomain)}`
      );
      setSubdomainAvailable(res.data?.available ?? false);
    } catch {
      toast.error("Failed to check subdomain");
    } finally {
      setCheckingSubdomain(false);
    }
  }

  async function handleDeploy() {
    if (!subdomain.trim()) {
      toast.error("Enter a subdomain");
      return;
    }
    setDeploying(true);
    try {
      await apiClient.post("/api/deploy", {
        project_id: projectId,
        subdomain: subdomain.trim(),
      });
      toast.success("Deployment started!");
      refetchDeployments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      toast.error(message);
    } finally {
      setDeploying(false);
    }
  }

  // Free plan gate
  if (isFree) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-xs">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold">Deployment is a paid feature</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to Starter or Pro to deploy your projects with custom
            subdomains.
          </p>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/dashboard/billing">Upgrade Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <h3 className="font-semibold text-sm">Deploy</h3>

      {/* Live deployment */}
      {isLive && latestDeployment.subdomain && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm text-green-500">Live</span>
          </div>
          <a
            href={`https://${latestDeployment.subdomain}.odeta.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {latestDeployment.subdomain}.odeta.app
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Pre-flight checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">
          Pre-flight checklist
        </h4>
        <div className="space-y-1.5">
          <ChecklistItem
            label="Build complete"
            checked={["BUILT", "DEPLOYED"].includes(projectStatus)}
          />
          <ChecklistItem
            label="GitHub connected"
            checked={!!githubRepoUrl}
          />
          <ChecklistItem
            label="Paid plan"
            checked={!isFree}
          />
        </div>
      </div>

      {/* Subdomain input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Subdomain
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={subdomain}
              onChange={(e) => {
                setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                setSubdomainAvailable(null);
              }}
              placeholder="my-project"
              className="pr-24"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              .odeta.app
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubdomain}
            disabled={checkingSubdomain || !subdomain.trim()}
          >
            {checkingSubdomain ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Check"
            )}
          </Button>
        </div>
        {subdomainAvailable !== null && (
          <p className={`text-xs ${subdomainAvailable ? "text-green-500" : "text-red-500"}`}>
            {subdomainAvailable ? "Available!" : "This subdomain is taken"}
          </p>
        )}
      </div>

      {/* Deploy button */}
      <Button
        className="w-full"
        onClick={handleDeploy}
        disabled={deploying || !subdomain.trim()}
      >
        {deploying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </>
        )}
      </Button>

      {/* Deployment history */}
      {deployments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Deployment history
          </h4>
          <div className="space-y-1.5">
            {deployments.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-xs rounded-lg border border-border/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <DeployStatusIcon status={d.status} />
                  <span className="font-mono">{d.subdomain}</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize py-0">
                  {d.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {checked ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function DeployStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "LIVE":
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    case "BUILDING":
    case "PENDING":
      return <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />;
    case "FAILED":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    default:
      return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}
