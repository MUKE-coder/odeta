"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, Coins, ArrowLeft, Shield, Zap,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/credits", label: "Credits", icon: Coins },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin sidebar */}
      <aside className="w-56 border-r border-border/40 bg-card flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-border/40">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span>Odeta Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {adminNav.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-border/40">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to App
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
