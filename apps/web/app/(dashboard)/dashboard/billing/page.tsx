"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Check, Coins, Loader2, Phone } from "lucide-react";

const tiers = [
  {
    name: "Free",
    plan: "free",
    priceLabel: "Free",
    credits: 100,
    features: ["100 credits/month", "AI chat (1 credit/msg)", "Project generation (5 credits)", "Community support"],
  },
  {
    name: "Starter",
    plan: "starter",
    priceLabel: "UGX 45,000/mo",
    credits: 500,
    features: ["500 credits/month", "Everything in Free", "Deploy to Orbita", "Priority support"],
    highlighted: true,
  },
  {
    name: "Pro",
    plan: "pro",
    priceLabel: "UGX 110,000/mo",
    credits: 2000,
    features: ["2,000 credits/month", "Everything in Starter", "Custom domains", "Team collaboration", "Priority AI queue"],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const { data: subData } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/billing/subscription");
      return data;
    },
  });

  const currentPlan = subData?.data?.plan || user?.plan || "free";
  const currentCredits = subData?.data?.credits ?? user?.credits ?? 0;

  async function handlePurchase(plan: string) {
    if (!phoneNumber.trim()) {
      toast.error("Enter your phone number to pay via mobile money");
      return;
    }

    setPurchasing(plan);
    try {
      const { data: res } = await apiClient.post("/api/billing/purchase", {
        plan,
        phone_number: phoneNumber,
        currency: "UGX",
      });

      setPaymentRef(res.data?.reference);
      toast.success(res.data?.message || "Check your phone to approve the payment");
      setSelectedPlan(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast.error(msg);
    } finally {
      setPurchasing(null);
    }
  }

  async function checkPaymentStatus() {
    if (!paymentRef) return;
    setChecking(true);
    try {
      const { data: res } = await apiClient.get(`/api/billing/check-payment?reference=${paymentRef}`);
      const status = res.data?.status;

      if (status === "completed") {
        toast.success("Payment completed! Credits added to your account.");
        setPaymentRef(null);
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      } else if (status === "failed") {
        toast.error("Payment failed. Please try again.");
        setPaymentRef(null);
      } else {
        toast.info("Payment is still pending. Check your phone.");
      }
    } catch {
      toast.error("Could not check payment status");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Billing</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage your plan and credits. Pay via mobile money (MTN/Airtel).
      </p>

      {/* Current plan card */}
      <div className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Current plan</p>
            <p className="text-lg font-bold text-foreground capitalize">{currentPlan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Credits remaining</p>
            <p className="text-lg font-bold text-foreground flex items-center gap-1 justify-end">
              <Coins className="h-4 w-4 text-warning" />
              {currentCredits}
            </p>
          </div>
        </div>
      </div>

      {/* Pending payment check */}
      {paymentRef && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Payment pending</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Ref: {paymentRef} — Approve on your phone
              </p>
            </div>
            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Check Status"}
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = currentPlan === tier.plan;
          return (
            <div
              key={tier.plan}
              className={`rounded-xl border bg-white p-5 ${
                tier.highlighted ? "border-accent ring-1 ring-accent/20" : ""
              }`}
            >
              {tier.highlighted && (
                <span className="inline-block mb-2 rounded-full bg-accent-light px-2.5 py-0.5 text-[10px] font-medium text-accent">
                  Most Popular
                </span>
              )}
              <h3 className="font-semibold text-foreground">{tier.name}</h3>
              <p className="mt-1 text-lg font-bold text-foreground">{tier.priceLabel}</p>
              <p className="text-xs text-accent">{tier.credits} credits</p>

              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {tier.plan === "free" ? (
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="block w-full rounded-lg border bg-surface py-2 text-center text-xs text-text-secondary">
                      Current Plan
                    </span>
                  ) : (
                    <span className="block w-full rounded-lg border bg-surface py-2 text-center text-xs text-text-tertiary">
                      Default
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="block w-full rounded-lg border bg-surface py-2 text-center text-xs text-text-secondary">
                      Current Plan
                    </span>
                  ) : selectedPlan === tier.plan ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 rounded-lg border px-3 py-2">
                        <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                        <input
                          type="tel"
                          placeholder="256771234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 border-0 bg-transparent text-xs focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handlePurchase(tier.plan)}
                        disabled={purchasing === tier.plan}
                        className="w-full rounded-lg bg-accent py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
                      >
                        {purchasing === tier.plan ? (
                          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Pay with Mobile Money"
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedPlan(null)}
                        className="w-full text-xs text-text-tertiary hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPlan(tier.plan)}
                      className={`w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                        tier.highlighted
                          ? "bg-accent text-white hover:bg-accent-hover"
                          : "border bg-white text-foreground hover:bg-surface"
                      }`}
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
