export interface ProjectPhase {
  id: number;
  project_id: number;
  phase_number: number;
  title: string;
  description: string;
  status: string;
  tasks: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
