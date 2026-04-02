"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCounter } from "./credit-counter";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus, FolderOpen, LogOut, Settings, CreditCard, Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/new", icon: Plus, label: "New" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <aside className="flex w-14 flex-col items-center border-r bg-white py-3">
      {/* Logo */}
      <Link href="/dashboard" className="mb-4" title="Odeta">
        <Zap className="h-5 w-5 text-accent" />
      </Link>

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-text-tertiary hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px]">
          <CreditCounter />
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent text-[10px] font-bold"
        >
          {initials}
        </button>
      </div>
    </aside>
  );
}
