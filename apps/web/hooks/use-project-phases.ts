import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ProjectPhase {
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

interface ProjectPhasesResponse {
  data: ProjectPhase[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

interface UseProjectPhasesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useProjectPhases({ page = 1, pageSize = 20, search = "", sortBy = "created_at", sortOrder = "desc" }: UseProjectPhasesParams = {}) {
  return useQuery<ProjectPhasesResponse>({
    queryKey: ["project_phases", { page, pageSize, search, sortBy, sortOrder }],
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
      const { data } = await apiClient.get(`/api/project_phases?${params}`);
      return data;
    },
  });
}

export function useGetProjectPhase(id: number) {
  return useQuery<ProjectPhase>({
    queryKey: ["project_phases", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/project_phases/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/project_phases", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_phases"] });
    },
  });
}

export function useUpdateProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & Record<string, unknown>) => {
      const { data } = await apiClient.put(`/api/project_phases/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_phases"] });
    },
  });
}

export function useDeleteProjectPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/project_phases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_phases"] });
    },
  });
}
