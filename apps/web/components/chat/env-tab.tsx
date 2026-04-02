"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Download, Eye, EyeOff, Key, Plus, Trash2, Upload } from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  database: "Database",
  auth: "Authentication",
  storage: "Storage",
  email: "Email",
  payment: "Payments",
  ai: "AI",
  other: "Other",
};

function detectCategory(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("database") || k.includes("postgres") || k.includes("redis") || k.includes("db_")) return "database";
  if (k.includes("auth") || k.includes("jwt") || k.includes("oauth") || k.includes("secret") && k.includes("key")) return "auth";
  if (k.includes("r2") || k.includes("s3") || k.includes("storage") || k.includes("minio") || k.includes("bucket")) return "storage";
  if (k.includes("mail") || k.includes("resend") || k.includes("smtp")) return "email";
  if (k.includes("stripe") || k.includes("dgateway") || k.includes("payment")) return "payment";
  if (k.includes("ai") || k.includes("openai") || k.includes("claude") || k.includes("gateway")) return "ai";
  return "other";
}

function isSecretKey(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes("secret") || k.includes("key") || k.includes("token") || k.includes("password") || k.includes("api_key");
}

function parseEnvContent(content: string): EnvVar[] {
  const vars: EnvVar[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) {
      vars.push({ key, value, isSecret: isSecretKey(key), category: detectCategory(key) });
    }
  }
  return vars;
}

export function EnvTab({ projectId }: { projectId: string }) {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [mode, setMode] = useState<"list" | "add" | "paste">("list");
  const [pasteContent, setPasteContent] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiClient
      .get(`/api/projects/${projectId}`)
      .then(({ data }) => {
        const meta = data?.data?.metadata;
        const parsed = typeof meta === "string" ? JSON.parse(meta || "{}") : meta || {};
        if (parsed.envVars) setVars(parsed.envVars);
      })
      .catch(() => {});
  }, [projectId]);

  async function saveVars(updated: EnvVar[]) {
    try {
      await apiClient.patch(`/api/projects/${projectId}/metadata`, {
        envVars: updated,
      });
      setVars(updated);
    } catch {
      toast.error("Failed to save variables");
    }
  }

  function handleAddOne() {
    if (!newKey.trim()) return;
    const newVar: EnvVar = {
      key: newKey,
      value: newValue,
      isSecret: isSecretKey(newKey),
      category: detectCategory(newKey),
    };
    const updated = [...vars.filter((v) => v.key !== newKey), newVar];
    saveVars(updated);
    setNewKey("");
    setNewValue("");
    setMode("list");
    toast.success(`Added ${newKey}`);
  }

  function handleBulkPaste() {
    const parsed = parseEnvContent(pasteContent);
    if (parsed.length === 0) {
      toast.error("No valid KEY=value pairs found");
      return;
    }
    const existingKeys = new Set(vars.map((v) => v.key));
    const merged = [...vars];
    for (const v of parsed) {
      if (existingKeys.has(v.key)) {
        const idx = merged.findIndex((m) => m.key === v.key);
        if (idx !== -1) merged[idx] = v;
      } else {
        merged.push(v);
      }
    }
    saveVars(merged);
    setPasteContent("");
    setMode("list");
    toast.success(`Imported ${parsed.length} variable${parsed.length > 1 ? "s" : ""}`);
  }

  function handleDelete(key: string) {
    saveVars(vars.filter((v) => v.key !== key));
    toast.success(`Removed ${key}`);
  }

  function downloadEnvFile() {
    const content = vars.map((v) => `${v.key}=${v.value}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env";
    a.click();
    URL.revokeObjectURL(url);
  }

  const grouped = vars.reduce<Record<string, EnvVar[]>>((acc, v) => {
    const cat = v.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Environment Variables</h3>
          <p className="text-[10px] text-text-tertiary">{vars.length} configured</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setMode("paste")} className="px-2.5 py-1.5 text-[10px] font-medium text-text-secondary border rounded-lg hover:bg-surface transition-colors flex items-center gap-1">
            <Upload className="w-3 h-3" /> Paste .env
          </button>
          <button onClick={() => setMode("add")} className="px-2.5 py-1.5 text-[10px] font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      {/* Paste mode */}
      {mode === "paste" && (
        <div className="p-3 border-b bg-surface">
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder={"DATABASE_URL=postgresql://...\nRESEND_API_KEY=re_..."}
            rows={5}
            className="w-full text-[11px] font-mono bg-white border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleBulkPaste} className="px-3 py-1.5 text-[10px] font-medium text-white bg-accent rounded-lg hover:bg-accent-hover">Import</button>
            <button onClick={() => { setMode("list"); setPasteContent(""); }} className="px-3 py-1.5 text-[10px] font-medium text-text-secondary border rounded-lg hover:bg-surface">Cancel</button>
          </div>
        </div>
      )}

      {/* Add one mode */}
      {mode === "add" && (
        <div className="p-3 border-b bg-surface space-y-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, "_"))} placeholder="VARIABLE_NAME" className="w-full text-xs font-mono bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value" type={isSecretKey(newKey) ? "password" : "text"} className="w-full text-xs font-mono bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <div className="flex gap-2">
            <button onClick={handleAddOne} className="px-3 py-1.5 text-[10px] font-medium text-white bg-accent rounded-lg hover:bg-accent-hover">Add</button>
            <button onClick={() => setMode("list")} className="px-3 py-1.5 text-[10px] font-medium text-text-secondary border rounded-lg hover:bg-surface">Cancel</button>
          </div>
        </div>
      )}

      {/* Variables list */}
      <div className="flex-1 overflow-y-auto">
        {vars.length === 0 && mode === "list" ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Key className="w-8 h-8 text-text-tertiary mb-3" />
            <p className="text-sm font-medium text-foreground">No variables yet</p>
            <p className="text-xs text-text-tertiary mt-1">Add them one by one or paste your .env file</p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(grouped).map(([category, categoryVars]) => (
              <div key={category}>
                <div className="px-4 py-1.5 bg-surface/50">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                </div>
                {categoryVars.map((v) => (
                  <div key={v.key} className="flex items-center gap-2 px-4 py-2 hover:bg-surface group">
                    <code className="text-[11px] font-mono text-foreground flex-shrink-0 w-40 truncate">{v.key}</code>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <code className="text-[11px] font-mono text-text-tertiary truncate">
                        {v.isSecret && !showValues[v.key] ? "••••••••" : v.value}
                      </code>
                      {v.isSecret && (
                        <button onClick={() => setShowValues((s) => ({ ...s, [v.key]: !s[v.key] }))} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-foreground transition-all">
                          {showValues[v.key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <button onClick={() => handleDelete(v.key)} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download */}
      {vars.length > 0 && (
        <div className="px-4 py-3 border-t">
          <button onClick={downloadEnvFile} className="w-full text-[10px] font-medium text-text-secondary border rounded-lg py-2 hover:bg-surface transition-colors flex items-center justify-center gap-1.5">
            <Download className="w-3 h-3" /> Download .env
          </button>
        </div>
      )}
    </div>
  );
}
