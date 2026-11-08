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

/** Путь /uploads/... или полный URL → абсолютный URL для <img> и скачивания */
export function resolveMediaUrl(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  const base = resolveApiUrl();
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function botArchiveDownloadUrl(botId: string): string {
  return `${resolveApiUrl()}/api/bots/${botId}/archive`;
}
