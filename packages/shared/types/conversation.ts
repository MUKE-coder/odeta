export interface Conversation {
  id: number;
  project_id: number;
  role: string;
  content: string;
  phase: string;
  credits_used: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}
