"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowRight, Globe, Layout, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const newProjectSchema = z.object({
  prompt: z.string().min(10, "Describe your project in at least 10 characters"),
  type: z.enum(["WEB_APP", "WEBSITE"]),
});

type NewProjectInput = z.infer<typeof newProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NewProjectInput>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      prompt: "",
      type: "WEB_APP",
    },
  });

  const selectedType = form.watch("type");

  async function onSubmit(data: NewProjectInput) {
    setIsLoading(true);
    try {
      // Create project via Go API
      const slug = data.prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 30);

      const name =
        data.prompt.length > 50
          ? data.prompt.slice(0, 50) + "..."
          : data.prompt;

      const res = await apiClient.post("/api/projects", {
        name,
        slug: slug || "my-project",
        type: data.type,
        status: "DRAFT",
        description: data.prompt,
      });

      const projectId = res.data?.id;
      if (projectId) {
        toast.success("Project created! Starting AI conversation...");
        router.push(`/dashboard/chat/${projectId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center mb-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">What do you want to build?</h1>
        <p className="mt-2 text-muted-foreground">
          Describe your project and Odeta will create a build plan using Grit +
          JB commands.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Project type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => form.setValue("type", "WEB_APP")}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                selectedType === "WEB_APP"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border"
              )}
            >
              <Layout className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Web App</h3>
              <p className="text-xs text-muted-foreground mt-1">
                User accounts, dashboard, API. Built with Grit Double.
              </p>
              {selectedType === "WEB_APP" && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Go + Next.js
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => form.setValue("type", "WEBSITE")}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                selectedType === "WEBSITE"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border"
              )}
            >
              <Globe className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Website</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Landing page, portfolio, blog. Next.js only.
              </p>
              {selectedType === "WEBSITE" && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Next.js
                </Badge>
              )}
            </button>
          </div>

          {/* Prompt input */}
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    {...field}
                    placeholder={
                      selectedType === "WEB_APP"
                        ? "e.g. A SaaS invoicing tool for freelancers with Stripe payments, client management, and PDF export..."
                        : "e.g. A minimal portfolio site for a developer with a blog, project showcase, and contact form..."
                    }
                    className="flex min-h-[120px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              "Creating project..."
            ) : (
              <>
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This will create a project and start an AI conversation (1
            credit/message)
          </p>
        </form>
      </Form>
    </div>
  );
}
