import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Terminal, Server, Shield, CreditCard, Rocket, Globe,
  Database, Layout, FileCode, Cpu, ArrowRight, Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Odeta",
  description: "Explore Odeta's features: Grit Framework integration, JB components, AI chat, deployment, and more.",
};

const gritFeatures = [
  { icon: Server, title: "Go API Backend", description: "Every web app gets a real Go API with Gin router, GORM ORM, and PostgreSQL. Not serverless functions — actual server performance." },
  { icon: Shield, title: "JWT Auth Built-in", description: "Register, login, refresh tokens, password reset, OAuth, TOTP/2FA — all built into Grit's scaffold. No AI generation needed." },
  { icon: Layout, title: "Admin Panel Auto-Generated", description: "Every grit generate resource command creates admin panel entries with data tables, create/edit forms, and search." },
  { icon: Database, title: "GORM + PostgreSQL", description: "Type-safe database models with automatic migrations, associations, indexes, and query optimization." },
  { icon: Cpu, title: "Background Jobs", description: "asynq + Redis for background processing — credit resets, email sending, image processing, deployment triggers." },
  { icon: FileCode, title: "Auto TypeScript Types", description: "Grit generates Zod schemas and TypeScript types for every resource. Frontend and backend always in sync." },
];

const jbComponents = [
  { name: "Auth UI", desc: "Sign in, sign up, OAuth, password reset" },
  { name: "Stripe UI", desc: "Pricing tables, checkout, billing portal" },
  { name: "File Storage", desc: "Upload, progress, R2/S3 integration" },
  { name: "Data Table", desc: "TanStack Table with sort, filter, pagination" },
  { name: "Multi-Step Form", desc: "Stepper, validation per step, progress" },
  { name: "Zustand Cart", desc: "Cart state, drawer, quantity management" },
  { name: "Consent Manager", desc: "GDPR cookie consent banner" },
  { name: "Testimonial", desc: "Customer testimonial cards" },
];

export default function FeaturesPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            Features
          </Badge>
          <h1 className="text-4xl font-bold">Commands over code generation</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Odeta orchestrates Grit Framework and JB component commands to build
            real apps — not hallucinated boilerplate.
          </p>
        </div>

        {/* Grit Framework */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-2">Grit Framework — Your Go Backend</h2>
          <p className="text-muted-foreground mb-8">
            Every web app Odeta generates uses Grit Double: a Go API + Next.js frontend monorepo.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gritFeatures.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border/60 bg-card p-6">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* JB Components */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-2">JB Component Registry</h2>
          <p className="text-muted-foreground mb-8">
            19 production-ready component sets. One command each. No AI generation.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jbComponents.map((comp) => (
              <div key={comp.name} className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">{comp.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{comp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-2">AI-Powered Build Pipeline</h2>
          <p className="text-muted-foreground mb-8">
            Odeta&apos;s AI understands your project, creates a build plan with exact commands,
            and executes them phase by phase with live progress streaming.
          </p>
          <div className="rounded-xl border border-border/60 bg-card p-8 max-w-2xl mx-auto font-mono text-sm">
            <p className="text-muted-foreground">You: <span className="text-foreground">Build me an invoicing SaaS for freelancers</span></p>
            <p className="mt-3 text-muted-foreground">Odeta: <span className="text-foreground">I&apos;ll use Grit Double for this. Here&apos;s the plan:</span></p>
            <div className="mt-2 ml-4 space-y-1 text-primary">
              <p>Phase 1: grit new invoice-pro --double --next</p>
              <p>Phase 2: grit generate resource Invoice --fields &quot;...&quot;</p>
              <p>Phase 3: grit generate resource Client --fields &quot;...&quot;</p>
              <p>Phase 4: pnpm dlx shadcn@latest add stripe-ui-component</p>
              <p>Phase 5: Custom business logic (PDF export)</p>
            </div>
            <p className="mt-3 text-muted-foreground">
              <span className="text-yellow-400">⚡ This will use 5 credits. Approve?</span>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold">Ready to build?</h2>
          <p className="mt-3 text-muted-foreground">100 free credits. No credit card required.</p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
