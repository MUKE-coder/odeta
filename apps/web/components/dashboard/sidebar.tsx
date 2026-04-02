"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CreditCounter } from "./credit-counter";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { Plus, FolderOpen, LogOut, Settings, CreditCard, Zap } from "lucide-react";

interface Project {
  id: number;
  name: string;
  type: string;
  status: string;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const { data: projectsData } = useQuery({
    queryKey: ["sidebar-projects"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/projects?page_size=20&sort_by=updated_at&sort_order=desc");
      return data;
    },
  });

  const projects: Project[] = projectsData?.data || [];

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <aside className="flex w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Zap className="h-5 w-5 text-accent" />
        <span className="font-bold text-foreground">Odeta</span>
      </div>

      {/* New Project button */}
      <div className="p-3">
        <Link
          href="/dashboard/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-2 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Recent Projects
        </p>
        {projects.length === 0 ? (
          <p className="px-2 py-4 text-xs text-text-tertiary text-center">
            No projects yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {projects.map((project) => {
              const isActive = pathname.includes(`/chat/${project.id}`) || pathname.includes(`/projects/${project.id}`);
              return (
                <Link
                  key={project.id}
                  href={`/dashboard/chat/${project.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent-light text-accent font-medium"
                      : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t">
        {/* Navigation links */}
        <div className="px-2 py-2 space-y-0.5">
          <Link
            href="/dashboard/billing"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
              pathname === "/dashboard/billing"
                ? "bg-accent-light text-accent font-medium"
                : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Billing
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
              pathname === "/dashboard/settings"
                ? "bg-accent-light text-accent font-medium"
                : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>

        {/* Credits */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">Credits</span>
            <CreditCounter />
          </div>
        </div>

        {/* User */}
        <div className="border-t px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent text-xs font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-text-tertiary">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-text-tertiary hover:text-danger transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
