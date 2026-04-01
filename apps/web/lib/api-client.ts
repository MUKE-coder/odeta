import { getAccessToken, refreshTokens, clearTokens } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class InsufficientCreditsError extends Error {
  balance: number;
  constructor(balance: number) {
    super("Insufficient credits");
    this.balance = balance;
    this.name = "InsufficientCreditsError";
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Handle 401 — try refresh
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = getAccessToken();
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options?.headers,
        },
      });
      if (retryRes.ok) {
        return retryRes.json();
      }
    }
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/sign-in";
    }
    throw new Error("Unauthorized");
  }

  // Handle 402 — insufficient credits
  if (res.status === 402) {
    const data = await res.json();
    throw new InsufficientCreditsError(data.error?.balance || 0);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(data.error?.message || "Request failed");
  }

  return res.json();
}

// Convenience methods matching the pattern used by Grit-generated hooks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
apiClient.get = (path: string): Promise<any> =>
  apiClient(path, { method: "GET" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
apiClient.post = (path: string, body?: unknown): Promise<any> =>
  apiClient(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
apiClient.put = (path: string, body?: unknown): Promise<any> =>
  apiClient(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
apiClient.delete = (path: string): Promise<any> =>
  apiClient(path, { method: "DELETE" });
