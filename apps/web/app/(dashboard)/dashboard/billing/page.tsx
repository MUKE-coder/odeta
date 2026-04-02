"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { CreditCounter } from "@/components/dashboard/credit-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Check, CreditCard, Coins, Zap, ExternalLink, Loader2,
} from "lucide-react";

const tiers = [
  {
    name: "Free",
    plan: "free",
    price: "$0",
    credits: 100,
    features: ["100 credits/month", "AI chat", "Project generation", "Community support"],
    highlighted: false,
  },
  {
    name: "Starter",
    plan: "starter",
    price: "$12",
    credits: 500,
    features: ["500 credits/month", "Deploy to Orbita", "Custom subdomains", "Priority support", "$0.05/extra credit"],
    highlighted: true,
  },
  {
    name: "Pro",
    plan: "pro",
    price: "$29",
    credits: 2000,
    features: ["2,000 credits/month", "Custom domains", "Priority AI queue", "Team (coming soon)", "$0.03/extra credit"],
    highlighted: false,
  },
];

interface SubscriptionResponse {
  data: {
    plan: string;
    credits: number;
    has_subscription: boolean;
    subscription_id?: string;
    status?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  };
}

export default function BillingPage() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: subData } = useQuery<SubscriptionResponse>({
    queryKey: ["subscription"],
    queryFn: async () => { const { data } = await apiClient.get("/api/billing/subscription"); return data; },
  });

  const subscription = subData?.data;
  const currentPlan = user?.plan || "free";
  const credits = user?.credits ?? 0;
  const maxCredits = tiers.find((t) => t.plan === currentPlan)?.credits || 100;
  const creditPercent = Math.min((credits / maxCredits) * 100, 100);

  async function handleUpgrade(plan: string) {
    if (plan === "free" || plan === currentPlan) return;
    setLoadingPlan(plan);
    try {
      const res = await apiClient.post("/api/billing/checkout", {
        price_id: `price_${plan}`, // placeholder — real Stripe price IDs configured in production
        mode: "subscription",
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upgrade failed";
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await apiClient.post("/api/billing/portal");
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal";
      toast.error(message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Current plan summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Current Plan</h2>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentPlan}
            </Badge>
          </div>

          {subscription?.has_subscription && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {subscription.status}
                </Badge>
              </div>
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renews</span>
                  <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </div>
              )}
              {subscription.cancel_at_period_end && (
                <p className="text-xs text-yellow-500 mt-2">
                  Subscription will cancel at end of period
                </p>
              )}
            </div>
          )}

          {subscription?.has_subscription && (
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleManageBilling}>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Manage Billing
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Credits</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <CreditCounter className="text-2xl" />
            <span className="text-sm text-muted-foreground">/ {maxCredits}</span>
          </div>
          <Progress value={creditPercent} className="h-2" />
          <p className="mt-3 text-xs text-muted-foreground">
            Credits reset monthly. Chat = 1 credit, Generate = 5 credits, Command = 2 credits.
          </p>
        </div>
      </div>

      {/* Pricing tiers */}
      <h2 className="text-lg font-semibold mb-4">Upgrade your plan</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isCurrent = tier.plan === currentPlan;
          return (
            <div
              key={tier.plan}
              className={`rounded-xl border p-6 ${
                tier.highlighted
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 bg-card"
              } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{tier.name}</h3>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{tier.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>

              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-5"
                variant={tier.highlighted && !isCurrent ? "default" : "outline"}
                disabled={isCurrent || tier.plan === "free" || !!loadingPlan}
                onClick={() => handleUpgrade(tier.plan)}
              >
                {loadingPlan === tier.plan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : tier.plan === "free" ? (
                  "Free"
                ) : (
                  <>
                    <Zap className="mr-2 h-3.5 w-3.5" />
                    Upgrade
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
