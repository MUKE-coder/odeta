export interface CreditLog {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string;
  project_id: number | null;
  created_at: string;
  updated_at: string;
}
