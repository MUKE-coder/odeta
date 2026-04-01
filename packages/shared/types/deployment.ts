export interface Deployment {
  id: number;
  project_id: number;
  status: string;
  subdomain: string;
  logs: string;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
}
