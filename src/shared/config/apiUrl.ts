const LOCAL_API = "http://localhost:8080";

export function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();

  if (fromEnv && fromEnv !== "SAME_ORIGIN") {
    return fromEnv.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return LOCAL_API;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return LOCAL_API;
}
