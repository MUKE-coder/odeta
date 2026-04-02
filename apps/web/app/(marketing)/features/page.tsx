import { Metadata } from "next";
import Link from "next/link";
import {
  Terminal, Shield, Rocket,
  Database, Layout, FileCode, Cpu, ArrowRight, Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Odeta",
  description: "Explore Odeta's features: AI-powered Next.js app building, JB components, deployment, and more.",
};

const platformFeatures = [
  { icon: Rocket, title: "Next.js Fullstack", description: "Every app gets a real Next.js project with App Router, API routes, server actions, and TypeScript." },
  { icon: Shield, title: "Auth Ready", description: "Better Auth UI component — sign in, sign up, OAuth, password reset, email verification. One command." },
  { icon: Layout, title: "Admin & Data Tables", description: "JB Data Table component with sorting, filtering, pagination. Manage any data instantly." },
  { icon: Database, title: "Database Integration", description: "Prisma ORM with PostgreSQL. Type-safe models, migrations, and relations auto-configured." },
  { icon: Cpu, title: "AI-Powered Discovery", description: "Smart questions to understand exactly what you need. No wasted code, no unnecessary features." },
  { icon: FileCode, title: "Component Commands", description: "19 production-ready JB components. Each installed with one command — auth, payments, file uploads, and more." },
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
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent mb-4">
            <Zap className="h-3 w-3" /> Features
          </span>
          <h1 className="text-4xl font-bold text-foreground">Commands over code generation</h1>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Odeta uses AI + battle-tested component commands to build real Next.js apps — not hallucinated boilerplate.
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-2">Platform Features</h2>
          <p className="text-text-secondary mb-8">
            Every app Odeta builds is a real Next.js fullstack project with production-ready components.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <feature.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-2">JB Component Registry</h2>
          <p className="text-text-secondary mb-8">
            19 production-ready component sets. One command each. No AI generation needed.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jbComponents.map((comp) => (
              <div key={comp.name} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="h-4 w-4 text-accent" />
                  <h4 className="font-medium text-sm text-foreground">{comp.name}</h4>
                </div>
                <p className="text-xs text-text-secondary">{comp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-2">AI-Powered Build Pipeline</h2>
          <p className="text-text-secondary mb-8">
            Odeta&apos;s AI understands your project, creates a build plan with exact commands,
            and executes them phase by phase.
          </p>
          <div className="rounded-xl border bg-white p-8 max-w-2xl mx-auto font-mono text-sm">
            <p className="text-text-secondary">You: <span className="text-foreground">Build me an invoicing SaaS for freelancers</span></p>
            <p className="mt-3 text-text-secondary">Odeta: <span className="text-foreground">I&apos;ll scaffold a Next.js fullstack app. Here&apos;s the plan:</span></p>
            <div className="mt-2 ml-4 space-y-1 text-accent">
              <p>Phase 1: pnpm create next-app invoice-pro --typescript --tailwind --app</p>
              <p>Phase 2: Install Better Auth UI component</p>
              <p>Phase 3: Install Stripe UI component</p>
              <p>Phase 4: Install Data Table component</p>
              <p>Phase 5: Custom business logic (PDF export)</p>
            </div>
            <p className="mt-3 text-text-secondary">
              <span className="text-warning">⚡ This will use 13 credits. Approve?</span>
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to build?</h2>
          <p className="mt-3 text-text-secondary">100 free credits. No credit card required.</p>
          <Link
            href="/auth/sign-up"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
