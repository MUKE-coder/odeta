"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-client";
import { savePendingPrompt } from "@/lib/pending-prompt";
import {
  ArrowRight, Check, Terminal, Shield, Zap, Globe, CreditCard, Rocket,
} from "lucide-react";

const categories = [
  { label: "Website", icon: "🌐", type: "WEBSITE" as const },
  { label: "Web App", icon: "⚡", type: "WEB_APP" as const },
  { label: "E-commerce", icon: "🛒", type: "WEB_APP" as const },
  { label: "Dashboard", icon: "📊", type: "WEB_APP" as const },
  { label: "Blog", icon: "📝", type: "WEBSITE" as const },
];

const features = [
  { icon: Terminal, title: "Commands Over Code Gen", description: "JB component commands replace thousands of lines of AI-generated code. Zero hallucinations." },
  { icon: Shield, title: "Production Auth", description: "Better Auth UI — sign in, sign up, OAuth, password reset. One command, battle-tested." },
  { icon: Rocket, title: "Full-Stack in Minutes", description: "Next.js fullstack with API routes. Auth, dashboard, email — all auto-scaffolded." },
  { icon: CreditCard, title: "Payments Ready", description: "Stripe + DGateway. One command for checkout, billing portal, and subscription management." },
  { icon: Globe, title: "Deploy Included", description: "One-click deployment via Orbita. Auto-provisioned subdomains for every project." },
  { icon: Zap, title: "19 JB Components", description: "Auth UI, data tables, file uploads, multi-step forms — install with one command each." },
];

const pricingTiers = [
  {
    name: "Free", price: "$0", period: "/month", credits: "100 credits/month",
    features: ["AI chat (1 credit/msg)", "Project generation (5 credits)", "JB component installs (2 credits)", "Community support"],
    cta: "Start Free", highlighted: false,
  },
  {
    name: "Starter", price: "$12", period: "/month", credits: "500 credits/month",
    features: ["Everything in Free", "Deploy to Orbita", "Custom subdomains", "Priority support", "$0.05 per extra credit"],
    cta: "Start Building", highlighted: true,
  },
  {
    name: "Pro", price: "$29", period: "/month", credits: "2,000 credits/month",
    features: ["Everything in Starter", "Custom domains", "Team collaboration", "Priority AI queue", "$0.03 per extra credit"],
    cta: "Go Pro", highlighted: false,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<"WEBSITE" | "WEB_APP">("WEB_APP");

  function handleSubmit() {
    if (!prompt.trim()) return;
    if (isAuthenticated()) {
      router.push(`/dashboard/new?prompt=${encodeURIComponent(prompt)}&type=${selectedType}`);
    } else {
      savePendingPrompt(prompt, selectedType);
      router.push("/auth/sign-up");
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-foreground">
            Odeta
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="text-sm text-text-secondary hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-full border border-accent bg-white px-4 py-1.5 text-sm font-medium text-accent hover:bg-accent-light transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            What will you build?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
            Describe your idea. Odeta builds it with component commands — not hallucinated code.
          </p>

          {/* Big prompt input */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-2xl border border-border-strong bg-white p-1 shadow-sm">
              <div className="flex items-end">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your idea, Odeta will bring it to life..."
                  rows={2}
                  className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="m-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover disabled:opacity-30 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedType(cat.type)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    selectedType === cat.type && cat.label === (selectedType === "WEBSITE" ? "Website" : "Web App")
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border bg-white text-text-secondary hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Everything you need to ship</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              Next.js + JB components + AI — a complete build pipeline.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <f.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-text-secondary">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-surface py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Simple, credit-based pricing</h2>
            <p className="mt-3 text-text-secondary">Start free. Scale as you build.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border bg-white p-6 ${
                  tier.highlighted ? "border-accent ring-1 ring-accent/20" : ""
                }`}
              >
                {tier.highlighted && (
                  <span className="inline-block mb-3 rounded-full bg-accent-light px-3 py-0.5 text-xs font-medium text-accent">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-text-secondary">{tier.period}</span>
                </div>
                <p className="mt-1 text-sm text-accent">{tier.credits}</p>
                <ul className="mt-6 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/sign-up"
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                    tier.highlighted
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border bg-white text-foreground hover:bg-surface"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-text-tertiary">
          &copy; {new Date().getFullYear()} Odeta. AI-powered app builder.
        </div>
      </footer>
    </>
  );
}
