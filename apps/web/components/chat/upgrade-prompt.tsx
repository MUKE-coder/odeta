"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coins, Zap } from "lucide-react";

interface UpgradePromptProps {
  credits: number;
  plan: string;
}

export function UpgradePrompt({ credits, plan }: UpgradePromptProps) {
  if (credits > 0) return null;

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 text-center">
      <Coins className="mx-auto h-8 w-8 text-yellow-500" />
      <h3 className="mt-3 font-semibold">You&apos;re out of credits</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your {plan} plan has 0 credits remaining. Upgrade to keep building.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button size="sm" asChild>
          <Link href="/dashboard/billing">
            <Zap className="mr-2 h-3.5 w-3.5" />
            Upgrade Plan
          </Link>
        </Button>
      </div>
    </div>
  );
}
