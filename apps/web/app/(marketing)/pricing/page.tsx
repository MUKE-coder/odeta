import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Odeta",
  description: "Simple, credit-based pricing. Start free with 100 credits/month.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    credits: 100,
    features: [
      "AI chat (1 credit per message)",
      "Project generation (5 credits)",
      "JB component installs (2 credits each)",
      "Unlimited projects (draft)",
      "Community support",
    ],
    limitations: ["No deployment", "No custom domains"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$12",
    credits: 500,
    features: [
      "Everything in Free",
      "Deploy to Orbita",
      "Custom subdomains (.odeta.app)",
      "GitHub repo auto-creation",
      "Priority support",
      "Extra credits at $0.05 each",
    ],
    limitations: [],
    cta: "Start Building",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$29",
    credits: 2000,
    features: [
      "Everything in Starter",
      "Custom domains",
      "Team collaboration (coming soon)",
      "Priority AI queue",
      "Extra credits at $0.03 each",
      "Dedicated support",
    ],
    limitations: [],
    cta: "Go Pro",
    highlighted: false,
  },
];

const creditCosts = [
  { action: "AI chat message", cost: 1 },
  { action: "Project generation (plan approval)", cost: 5 },
  { action: "JB component command install", cost: 2 },
  { action: "Grit resource generation", cost: 2 },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Simple, credit-based pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Pay only for what you use. Every plan includes a monthly credit
            allowance. Credits reset each billing cycle.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-8 ${
                tier.highlighted
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 relative"
                  : "border-border/60 bg-card"
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <h3 className="text-xl font-semibold">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-primary font-medium">
                {tier.credits.toLocaleString()} credits/month
              </p>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-8"
                variant={tier.highlighted ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link href="/auth/sign-up">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Credit costs table */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Credit costs</h2>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium">Action</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {creditCosts.map((item) => (
                  <tr key={item.action} className="border-b border-border/40 last:border-0">
                    <td className="py-3 px-4 text-sm">{item.action}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-primary">
                      {item.cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
