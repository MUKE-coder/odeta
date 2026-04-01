import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface CreditLog {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string;
  project_id: number;
  created_at: string;
  updated_at: string;
}

interface CreditLogsResponse {
  data: CreditLog[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

interface UseCreditLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useCreditLogs({ page = 1, pageSize = 20, search = "", sortBy = "created_at", sortOrder = "desc" }: UseCreditLogsParams = {}) {
  return useQuery<CreditLogsResponse>({
    queryKey: ["credit_logs", { page, pageSize, search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) {
        params.set("search", search);
      }
      const { data } = await apiClient.get(`/api/credit_logs?${params}`);
      return data;
    },
  });
}

export function useGetCreditLog(id: number) {
  return useQuery<CreditLog>({
    queryKey: ["credit_logs", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/credit_logs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCreditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/credit_logs", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_logs"] });
    },
  });
}

export function useUpdateCreditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & Record<string, unknown>) => {
      const { data } = await apiClient.put(`/api/credit_logs/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_logs"] });
    },
  });
}

export function useDeleteCreditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/credit_logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_logs"] });
    },
  });
}
