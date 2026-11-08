export const AUTH_COOKIE_NAME = "token";

export const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? ";Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
};

export const getCookie = (name: string) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) {
      const raw = c.substring(nameEQ.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
};

export const deleteCookie = (name: string) => {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? ";Secure"
      : "";
  document.cookie = `${name}=;Max-Age=-99999999;path=/;SameSite=Lax${secure}`;
};

export const getAuthToken = () => getCookie(AUTH_COOKIE_NAME)?.trim() || null;

export const persistAuthToken = (userId: string, days = 7) => {
  setCookie(AUTH_COOKIE_NAME, userId, days);
  const saved = getAuthToken();
  if (saved !== userId) {
    deleteCookie(AUTH_COOKIE_NAME);
    throw new Error(
      "Не удалось сохранить сессию. Разрешите cookies для этого сайта."
    );
  }
};
