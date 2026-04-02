const PENDING_PROMPT_KEY = "odeta_pending_prompt";
const PENDING_TYPE_KEY = "odeta_pending_type";

export function savePendingPrompt(prompt: string, type: "WEBSITE" | "WEB_APP") {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_PROMPT_KEY, prompt);
  localStorage.setItem(PENDING_TYPE_KEY, type);
}

export function getPendingPrompt(): {
  prompt: string;
  type: "WEBSITE" | "WEB_APP";
} | null {
  if (typeof window === "undefined") return null;
  const prompt = localStorage.getItem(PENDING_PROMPT_KEY);
  if (!prompt) return null;
  const type = (localStorage.getItem(PENDING_TYPE_KEY) || "WEB_APP") as
    | "WEBSITE"
    | "WEB_APP";
  return { prompt, type };
}

export function clearPendingPrompt() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_PROMPT_KEY);
  localStorage.removeItem(PENDING_TYPE_KEY);
}
