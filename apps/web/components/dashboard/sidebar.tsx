"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCounter } from "./credit-counter";
import { useAuth } from "@/hooks/use-auth";
import {
  FolderOpen,
  Plus,
  Settings,
  CreditCard,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/new", label: "New Project", icon: Plus },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
    : "?";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-bg-secondary transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <Zap className="h-5 w-5 text-accent" />
            <span>Odeta</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Zap className="h-5 w-5 text-accent" />
          </Link>
        )}
        <button
          className={cn(
            "h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors",
            collapsed && "hidden md:flex mx-auto"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:bg-bg-hover hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div className={cn("px-3 py-3 border-t border-border", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Credits</span>
            <CreditCounter />
          </div>
        ) : (
          <CreditCounter className="justify-center" />
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div
          className={cn(
            "flex items-center gap-3 text-sm",
            collapsed && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-medium shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground text-xs">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-text-muted">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-text-muted hover:text-danger transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
