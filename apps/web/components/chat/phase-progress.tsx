"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";

const API_URL = "";

interface PhaseEvent {
  type: string;
  phase_id: number;
  phase: number;
  task: string;
  output?: string;
  status?: string;
  timestamp: string;
}

interface Phase {
  number: number;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  tasks: string[];
}

export function PhaseProgress({ projectId }: { projectId: number }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentOutput, setCurrentOutput] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) return;

    const eventSource = new EventSource(
      `${API_URL}/api/projects/${projectId}/progress?token=${token}`
    );

    eventSource.onopen = () => setConnected(true);

    eventSource.addEventListener("phase_started", (e) => {
      const event: PhaseEvent = JSON.parse(e.data);
      setPhases((prev) => {
        const existing = prev.find((p) => p.number === event.phase);
        if (existing) {
          return prev.map((p) =>
            p.number === event.phase ? { ...p, status: "in_progress" } : p
          );
        }
        return [
          ...prev,
          {
            number: event.phase,
            title: event.task,
            status: "in_progress",
            tasks: [],
          },
        ];
      });
    });

    eventSource.addEventListener("task_completed", (e) => {
      const event: PhaseEvent = JSON.parse(e.data);
      setPhases((prev) =>
        prev.map((p) =>
          p.number === event.phase
            ? { ...p, tasks: [...p.tasks, event.task] }
            : p
        )
      );
    });

    eventSource.addEventListener("command_output", (e) => {
      const event: PhaseEvent = JSON.parse(e.data);
      setCurrentOutput(event.output || "");
    });

    eventSource.addEventListener("phase_completed", (e) => {
      const event: PhaseEvent = JSON.parse(e.data);
      setPhases((prev) =>
        prev.map((p) =>
          p.number === event.phase ? { ...p, status: "completed" } : p
        )
      );
      setCurrentOutput("");
    });

    eventSource.addEventListener("error", (e) => {
      const event: PhaseEvent = JSON.parse((e as MessageEvent).data);
      setPhases((prev) =>
        prev.map((p) =>
          p.number === event.phase ? { ...p, status: "failed" } : p
        )
      );
    });

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [projectId]);

  if (phases.length === 0 && !connected) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Waiting for build to start...
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h3 className="font-semibold text-sm">Build Progress</h3>

      <div className="space-y-2">
        {phases.map((phase) => (
          <div
            key={phase.number}
            className={cn(
              "rounded-lg border p-3 text-sm",
              phase.status === "in_progress" && "border-primary/30 bg-primary/5",
              phase.status === "completed" && "border-green-500/20 bg-green-500/5",
              phase.status === "failed" && "border-red-500/20 bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-2">
              {phase.status === "pending" && (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              {phase.status === "in_progress" && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {phase.status === "completed" && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {phase.status === "failed" && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                Phase {phase.number}: {phase.title}
              </span>
            </div>

            {phase.tasks.length > 0 && (
              <ul className="mt-2 ml-6 space-y-1">
                {phase.tasks.map((task, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {currentOutput && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Command Output
          </h4>
          <pre className="rounded-lg bg-muted/50 border border-border/40 p-3 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
            {currentOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
