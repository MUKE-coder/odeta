"use client";

import { useAuth } from "@/hooks/use-auth";
import { CreditCounter } from "@/components/dashboard/credit-counter";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="rounded-xl border border-border/60 bg-card p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Current Plan</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="capitalize text-sm">
            {user?.plan || "free"}
          </Badge>
          <CreditCounter />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Full billing management coming soon — Stripe checkout, plan upgrades,
          and payment history.
        </p>
      </div>
    </div>
  );
}
