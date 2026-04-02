"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FolderOpen, Rocket, Coins, TrendingUp, TrendingDown } from "lucide-react";

interface StatsResponse {
  data: {
    users: number;
    projects: number;
    deployed: number;
    credit_logs: number;
    credits_issued: number;
    credits_consumed: number;
    plans: { plan: string; count: number }[];
  };
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["admin-stats"],
    queryFn: async () => { const { data } = await apiClient.get("/api/admin/stats"); return data; },
    refetchInterval: 60000,
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users ?? 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Projects",
      value: stats?.projects ?? 0,
      icon: FolderOpen,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Deployed",
      value: stats?.deployed ?? 0,
      icon: Rocket,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Credit Transactions",
      value: stats?.credit_logs ?? 0,
      icon: Coins,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Credits summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold text-sm">Credits Issued (This Month)</h3>
          </div>
          <p className="text-3xl font-bold text-green-500">
            {(stats?.credits_issued ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-sm">Credits Consumed (This Month)</h3>
          </div>
          <p className="text-3xl font-bold text-red-500">
            {(stats?.credits_consumed ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Plan breakdown */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Users by Plan</h3>
        <div className="grid grid-cols-3 gap-4">
          {(stats?.plans || []).map((p) => (
            <div key={p.plan} className="text-center">
              <p className="text-2xl font-bold">{p.count}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.plan}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
