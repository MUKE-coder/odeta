"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User, Shield, Bell, Link2, AlertTriangle, Loader2, Save,
} from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function SettingsPage() {
  const { user, refetch } = useAuth();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [deleting, setDeleting] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
    : "?";

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await apiClient.put("/api/profile", {
        first_name: firstName,
        last_name: lastName,
      });
      await refetch();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiClient.delete("/api/profile");
      toast.success("Account deleted");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold mb-4">Profile Information</h2>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 text-xs capitalize">
                  {user?.plan} plan
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button className="mt-4" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold mb-4">Change Password</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update your password to keep your account secure.
            </p>
            <Button variant="outline" asChild>
              <a href="/auth/change-password">Change Password</a>
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold mb-4">Active Sessions</h2>
            <p className="text-sm text-muted-foreground">
              Session management coming soon — view and revoke active sessions across devices.
            </p>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold mb-4">Email Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Notification preferences coming soon — control which emails you receive.
            </p>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold text-sm">GitHub</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect GitHub to auto-create repos for your projects
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Separator className="my-8 max-w-2xl" />
      <div className="max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Delete Account
        </Button>
      </div>
    </div>
  );
}
