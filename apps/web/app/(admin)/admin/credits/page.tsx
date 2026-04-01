"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Coins, Plus, Minus, Loader2 } from "lucide-react";

interface CreditLog {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string;
  project_id: number | null;
  created_at: string;
}

interface CreditLogsResponse {
  data: CreditLog[];
}

export default function AdminCreditsPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<CreditLogsResponse>({
    queryKey: ["admin-credit-logs"],
    queryFn: () => apiClient.get("/api/credit_logs?sort_by=created_at&sort_order=desc&page_size=50"),
  });

  const logs = data?.data || [];

  async function handleAdjust(isAdd: boolean) {
    if (!userId || !amount || !description) {
      toast.error("All fields are required");
      return;
    }
    setAdjusting(true);
    try {
      const adjustAmount = isAdd ? parseInt(amount) : -parseInt(amount);
      await apiClient.post(`/api/admin/users/${userId}/credits`, {
        amount: adjustAmount,
        description,
      });
      toast.success(`Credits ${isAdd ? "added" : "removed"} successfully`);
      setDialogOpen(false);
      setUserId("");
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-credit-logs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  }

  const typeColors: Record<string, string> = {
    EARNED: "bg-green-500/10 text-green-500",
    PURCHASE: "bg-green-500/10 text-green-500",
    MONTHLY_RESET: "bg-blue-500/10 text-blue-500",
    SPENT_MESSAGE: "bg-yellow-500/10 text-yellow-500",
    SPENT_GENERATION: "bg-orange-500/10 text-orange-500",
    SPENT_COMMAND: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Credit Management</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Coins className="mr-2 h-4 w-4" />
              Adjust Credits
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Credit Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Number of credits"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Customer support credit"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleAdjust(true)}
                  disabled={adjusting}
                >
                  {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Credits
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleAdjust(false)}
                  disabled={adjusting}
                >
                  {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Minus className="mr-2 h-4 w-4" />}
                  Remove Credits
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit log table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-muted/50">
              <th className="text-left py-3 px-4 text-xs font-medium">ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium">User</th>
              <th className="text-left py-3 px-4 text-xs font-medium">Type</th>
              <th className="text-right py-3 px-4 text-xs font-medium">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium">Description</th>
              <th className="text-left py-3 px-4 text-xs font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No credit transactions yet
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 px-4 text-xs font-mono text-muted-foreground">
                    {log.id}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-mono">
                    {log.user_id}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-xs py-0 ${typeColors[log.type] || ""}`}
                    >
                      {log.type}
                    </Badge>
                  </td>
                  <td className={`py-2.5 px-4 text-xs text-right font-mono font-medium ${
                    log.amount > 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {log.amount > 0 ? "+" : ""}{log.amount}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                    {log.description}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
