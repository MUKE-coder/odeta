const getDraftKey = (projectId: string) => `odeta_chat_draft_${projectId}`;

export function saveDraft(projectId: string, text: string) {
  if (typeof window === "undefined") return;
  if (text.trim()) {
    localStorage.setItem(getDraftKey(projectId), text);
  } else {
    localStorage.removeItem(getDraftKey(projectId));
  }
}

export function loadDraft(projectId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getDraftKey(projectId)) || "";
}

export function clearDraft(projectId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getDraftKey(projectId));
}
