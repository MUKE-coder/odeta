"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditsResponse {
  data: { credits: number };
}

export function CreditCounter({ className }: { className?: string }) {
  const { data } = useQuery<CreditsResponse>({
    queryKey: ["credits"],
    queryFn: () => apiClient.get("/api/me/credits"),
    refetchInterval: 30000,
  });

  const credits = data?.data?.credits ?? 0;

  const colorClass =
    credits > 50
      ? "text-green-500"
      : credits > 10
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <Coins className={cn("h-4 w-4", colorClass)} />
      <span className={cn("font-mono font-medium", colorClass)}>
        {credits}
      </span>
    </div>
  );
}
