import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShimmeringText } from "@/components/shimmering-text";
import {
  Zap, Terminal, Shield, Globe, CreditCard, Rocket,
  ArrowRight, Check, Command, Server
} from "lucide-react";

export const metadata: Metadata = {
  title: "Odeta — Ship real apps, not just code.",
  description: "AI-powered full-stack app builder for developers. Build production-ready apps using Grit Framework commands — not hallucinated boilerplate.",
  openGraph: {
    title: "Odeta — Ship real apps, not just code.",
    description: "AI-powered full-stack app builder. Commands over code generation.",
    type: "website",
  },
};

const features = [
  {
    icon: Terminal,
    title: "Commands > Code Gen",
    description: "Grit + JB commands replace thousands of lines of AI-generated code. Zero hallucinations.",
  },
  {
    icon: Server,
    title: "Real Go Backend",
    description: "Every web app ships with a Go API — JWT auth, RBAC, background jobs, admin panel included.",
  },
  {
    icon: Shield,
    title: "Production Auth",
    description: "Grit's built-in JWT auth + JB Auth UI. Not AI-generated security — battle-tested code.",
  },
  {
    icon: CreditCard,
    title: "Payments Ready",
    description: "Stripe (global) + DGateway (African markets). One command for full billing UI.",
  },
  {
    icon: Rocket,
    title: "Deploy Included",
    description: "One-click deployment via Orbita. Auto-provisioned subdomains for every project.",
  },
  {
    icon: Globe,
    title: "African Payments",
    description: "DGateway integration for mobile money and local payment methods across Africa.",
  },
];

const steps = [
  { step: "01", title: "Describe", description: "Tell Odeta what you want to build in plain language." },
  { step: "02", title: "Clarify", description: "AI asks 3-5 targeted questions to understand your project." },
  { step: "03", title: "Plan", description: "Review the generated build plan with exact Grit + JB commands." },
  { step: "04", title: "Build & Deploy", description: "Phases execute automatically. Ship to production in minutes." },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    credits: "100 credits/month",
    features: ["AI chat (1 credit/msg)", "Project generation (5 credits)", "JB component installs (2 credits)", "Community support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$12",
    period: "/month",
    credits: "500 credits/month",
    features: ["Everything in Free", "Deploy to Orbita", "Custom subdomains", "Priority support", "$0.05 per extra credit"],
    cta: "Start Building",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    credits: "2,000 credits/month",
    features: ["Everything in Starter", "Custom domains", "Team collaboration", "Priority AI queue", "$0.03 per extra credit"],
    cta: "Go Pro",
    highlighted: false,
  },
];

const jbCommands = [
  "Auth UI", "Stripe UI", "File Storage", "Data Table", "Multi-Step Form",
  "Zustand Cart", "Consent Manager", "Testimonial", "Glow Card Grid",
  "Shimmering Text", "Tag Input", "Copy Button", "Currency Input",
  "Searchable Select", "Scroll Fade", "Editable Cell", "Work Experience",
  "Quantity Control", "Middle Truncation",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="mr-1 h-3 w-3" />
            Powered by Grit Framework
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            <ShimmeringText text="Ship real apps," as="span" className="block" />
            <span className="block mt-2 text-muted-foreground">not just code.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AI-powered full-stack app builder for developers. Odeta uses Grit Framework
            commands and JB components — not hallucinated boilerplate — to build
            production-ready apps in minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Start Building Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/features">See How It Works</Link>
            </Button>
          </div>

          {/* Terminal preview */}
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border/60 bg-card p-4 text-left font-mono text-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-muted-foreground">terminal</span>
            </div>
            <div className="space-y-1 text-muted-foreground">
              <p><span className="text-green-400">$</span> grit new invoice-pro --double --next</p>
              <p className="text-primary">✓ Go API + Next.js scaffold created</p>
              <p><span className="text-green-400">$</span> grit generate resource Invoice --fields &quot;title:string,amount:float,status:string&quot;</p>
              <p className="text-primary">✓ Model + API + Admin + Types + Hooks generated</p>
              <p><span className="text-green-400">$</span> pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json</p>
              <p className="text-primary">✓ Stripe payments UI installed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-t border-border/40 py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-12">Why not just use Lovable or v0?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
              <h3 className="font-semibold text-destructive mb-2">AI Code Gen</h3>
              <p className="text-sm text-muted-foreground">Generates entire auth systems from scratch. Hallucinated APIs. Security bugs. High token cost.</p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-6">
              <h3 className="font-semibold text-yellow-500 mb-2">UI-Only Tools</h3>
              <p className="text-sm text-muted-foreground">Beautiful components, but no backend. No auth, no database, no deployment. You build the hard parts.</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
              <h3 className="font-semibold text-primary mb-2">Odeta</h3>
              <p className="text-sm text-muted-foreground">Commands over code gen. Real Go backend. Admin panel auto-generated. Deploy included. Zero hallucinations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need to ship</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Odeta combines Grit Framework, JB components, and AI to give you a complete build pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-xl border border-border/60 bg-card p-6 hover:border-primary/30 transition-colors">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/40 py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-12">How Odeta works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JB Commands Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">19 JB Component Commands</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              One command installs production-ready features. No AI generation needed.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {jbCommands.map((cmd) => (
              <Badge key={cmd} variant="secondary" className="px-3 py-1.5 text-xs">
                <Command className="mr-1 h-3 w-3" />
                {cmd}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/40 py-20 bg-muted/30" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, credit-based pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Scale as you build.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 ${
                  tier.highlighted
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 bg-card"
                }`}
              >
                {tier.highlighted && (
                  <Badge className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-1 text-sm text-primary">{tier.credits}</p>

                <ul className="mt-6 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-6"
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/auth/sign-up">{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to ship?</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Start with 100 free credits. No credit card required.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
