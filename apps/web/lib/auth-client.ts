import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function getRefreshToken(): string | undefined {
  return Cookies.get("refresh_token");
}

export function setTokens(tokens: { access_token: string; refresh_token: string }) {
  Cookies.set("access_token", tokens.access_token, { expires: 1 });
  Cookies.set("refresh_token", tokens.refresh_token, { expires: 7 });
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getOAuthURL(provider: "google" | "github"): string {
  return `${API_URL}/api/auth/oauth/${provider}`;
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token");
}
