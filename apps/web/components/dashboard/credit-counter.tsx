"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function CreditCounter({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/api/me/credits");
        return data;
      } catch {
        return { data: { credits: 0 } };
      }
    },
    refetchInterval: 30000,
    retry: false,
  });

  const credits = data?.data?.credits ?? 0;

  const colorClass =
    credits > 50
      ? "text-success"
      : credits > 10
        ? "text-warning"
        : "text-danger";

  return (
    <span className={cn("text-sm font-mono font-medium", colorClass, className)}>
      {credits}
    </span>
  );
}
