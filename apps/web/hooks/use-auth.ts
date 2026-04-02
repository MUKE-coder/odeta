import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/api-client";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar: string;
  credits: number;
  plan: string;
  active: boolean;
}

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/auth/me");
      return data.data;
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post("/api/auth/logout");
      } catch {
        // Ignore
      }
    },
    onSettled: () => {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      queryClient.clear();
      router.push("/auth/sign-in");
    },
  });
}

/**
 * Compatibility hook — wraps useMe + useLogout into the old useAuth shape.
 * Used by sidebar, dashboard pages, settings, etc.
 */
export function useAuth() {
  const { data: user, isLoading, refetch } = useMe();
  const { mutate: logoutMutate } = useLogout();

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutate(),
    refetch,
  };
}
