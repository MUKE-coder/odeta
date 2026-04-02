"use client";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  className,
}: LogoutButtonProps) {
  const { mutate: logout, isPending } = useLogout();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => logout()}
      disabled={isPending}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
