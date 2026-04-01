import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Deployment {
  id: number;
  project_id: number;
  status: string;
  subdomain: string;
  logs: string;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DeploymentsResponse {
  data: Deployment[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

interface UseDeploymentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useDeployments({ page = 1, pageSize = 20, search = "", sortBy = "created_at", sortOrder = "desc" }: UseDeploymentsParams = {}) {
  return useQuery<DeploymentsResponse>({
    queryKey: ["deployments", { page, pageSize, search, sortBy, sortOrder }],
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
      const { data } = await apiClient.get(`/api/deployments?${params}`);
      return data;
    },
  });
}

export function useGetDeployment(id: number) {
  return useQuery<Deployment>({
    queryKey: ["deployments", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/deployments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/deployments", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}

export function useUpdateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & Record<string, unknown>) => {
      const { data } = await apiClient.put(`/api/deployments/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/deployments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}
