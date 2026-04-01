"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useOdetaChat } from "@/hooks/use-chat";
import { ChatMessageBubble, TypingIndicator, CreditNotice } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { PhaseProgress } from "@/components/chat/phase-progress";
import { UpgradePrompt } from "@/components/chat/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Coins, FileCode, Layers, Monitor, Rocket } from "lucide-react";
import { DeployPanel } from "@/components/chat/deploy-panel";
import Link from "next/link";

interface Project {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  subdomain?: string;
  github_repo_url?: string;
}

export default function ChatPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const { user, refetch: refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastCreditInfo, setLastCreditInfo] = useState<{
    used: number;
    remaining: number;
  } | null>(null);

  // Fetch project
  const { data: projectData, isLoading: projectLoading } = useQuery<{
    data: Project;
  }>({
    queryKey: ["project", projectId],
    queryFn: () => apiClient.get(`/api/projects/${projectId}`),
    enabled: !!projectId,
  });

  const project = projectData?.data;

  // Chat hook
  const {
    messages,
    sendMessage,
    isStreaming,
    stopStreaming,
  } = useOdetaChat({
    projectId,
    onCreditsUpdate: (used, remaining) => {
      setLastCreditInfo({ used, remaining });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      refetchUser();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (projectLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] gap-4">
        <Skeleton className="flex-1 rounded-xl" />
        <Skeleton className="w-96 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasNoCredits = (user?.credits ?? 0) <= 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 -m-6 md:-m-8 p-4">
      {/* Left panel — Chat */}
      <div className="flex flex-1 flex-col rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="font-semibold text-sm">{project.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs py-0">
                  {project.type === "WEB_APP" ? "Web App" : "Website"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs py-0 capitalize"
                >
                  {project.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>{user?.credits ?? 0} credits</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <h3 className="font-semibold text-lg">
                  Let&apos;s build {project.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Describe your project in detail. I&apos;ll ask clarifying
                  questions, then create a build plan using Grit + JB commands.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Each message costs 1 credit
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator />
          )}

          {lastCreditInfo && !isStreaming && (
            <CreditNotice
              used={lastCreditInfo.used}
              remaining={lastCreditInfo.remaining}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/40 px-4 py-3">
          {hasNoCredits ? (
            <UpgradePrompt credits={0} plan={user?.plan || "free"} />
          ) : (
            <ChatInput
              onSend={sendMessage}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              disabled={hasNoCredits}
              placeholder={
                messages.length === 0
                  ? "Describe what you want to build..."
                  : "Ask a follow-up question or request changes..."
              }
            />
          )}
        </div>
      </div>

      {/* Right panel — Build Output */}
      <div className="hidden lg:flex w-96 flex-col rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs defaultValue="phases" className="flex flex-col h-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent px-2 h-11">
            <TabsTrigger value="phases" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Phases
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs gap-1.5">
              <FileCode className="h-3.5 w-3.5" />
              Code
            </TabsTrigger>
            <TabsTrigger value="deploy" className="text-xs gap-1.5">
              <Rocket className="h-3.5 w-3.5" />
              Deploy
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="flex-1 overflow-y-auto m-0">
            <PhaseProgress projectId={projectId} />
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-y-auto m-0 p-4">
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Code output will appear here during generation
            </div>
          </TabsContent>

          <TabsContent value="deploy" className="flex-1 overflow-y-auto m-0">
            <DeployPanel
              projectId={projectId}
              projectSlug={project.slug}
              projectStatus={project.status}
              githubRepoUrl={project.github_repo_url}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto m-0 p-4">
            {project.subdomain ? (
              <iframe
                src={`https://${project.subdomain}.odeta.app`}
                className="w-full h-full rounded-lg border border-border/40"
                title="Live Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center">
                <div>
                  <Monitor className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p>Deploy to preview your app</p>
                  <p className="text-xs mt-1">Available on Starter and Pro plans</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
