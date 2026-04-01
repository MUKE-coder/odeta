export interface Project {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  tech_stack: string;
  github_repo_url: string;
  github_repo_name: string;
  subdomain: string;
  custom_domain: string;
  orbita_app_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}
