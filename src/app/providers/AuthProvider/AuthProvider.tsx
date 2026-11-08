import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi } from "@app/api/auth";
import { User } from "@app/types/user";
import {
  deleteCookie,
  getAuthToken,
  persistAuthToken,
  AUTH_COOKIE_NAME,
} from "@shared/utils/cookie";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSessionActive = (user: User | null): boolean => {
  if (!user?.id) return false;
  const token = getAuthToken();
  return token === user.id;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    deleteCookie(AUTH_COOKIE_NAME);
  }, []);

  const syncSessionWithCookie = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setUser((current) => (current ? null : current));
      return;
    }
    setUser((current) => {
      if (!current) return null;
      return current.id === token ? current : null;
    });
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          clearSession();
          return;
        }
        const currentUser = await authApi.getCurrentUser();
        if (!currentUser || currentUser.id !== token) {
          clearSession();
          return;
        }
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    initializeUser();
  }, [clearSession]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncSessionWithCookie();
      }
    };
    window.addEventListener("focus", syncSessionWithCookie);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", syncSessionWithCookie);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncSessionWithCookie]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await authApi.login(email, password);
      persistAuthToken(loggedInUser.id);
      setUser(loggedInUser);
    } catch (e: any) {
      setError(e.message || "Ошибка входа");
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.logout();
      clearSession();
    } catch (e: any) {
      setError(e.message || "Ошибка выхода");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const registeredUser = await authApi.register(email, password, name);
      persistAuthToken(registeredUser.id);
      setUser(registeredUser);
    } catch (e: any) {
      setError(e.message || "Ошибка регистрации");
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authApi.updateProfile(user.id, data);
      setUser(updatedUser);
    } catch (e: any) {
      setError(e.message || "Ошибка обновления профиля");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isSessionActive(user),
        isLoading,
        error,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
