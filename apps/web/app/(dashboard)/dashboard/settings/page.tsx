"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
    : "?";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="rounded-xl border border-border/60 bg-card p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs capitalize">
              {user?.role?.toLowerCase()}
            </Badge>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Full settings (profile edit, avatar upload, password change, sessions)
          coming in Phase 9.
        </p>
      </div>
    </div>
  );
}
