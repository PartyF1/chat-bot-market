import axiosInstance from "./axios";
import { User } from "@app/types/user";
import { deleteCookie, getAuthToken, AUTH_COOKIE_NAME } from "@shared/utils/cookie";
import { ensureArray } from "@shared/utils/ensureArray";

function assertCredentials(email: string, password: string) {
  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();
  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Введите email и пароль");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Укажите корректный email");
  }
  return { normalizedEmail, normalizedPassword };
}

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const { normalizedEmail, normalizedPassword } =
      assertCredentials(email, password);

    const { data } = await axiosInstance.get<User[]>("/users", {
      params: { email: normalizedEmail, password: normalizedPassword },
    });
    const users = ensureArray<User>(data);

    const user = users[0];
    if (!user?.id) {
      throw new Error("Неверный email или пароль");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  register: async (
    email: string,
    password: string,
    name?: string
  ): Promise<User> => {
    const { normalizedEmail, normalizedPassword } =
      assertCredentials(email, password);

    if (normalizedPassword.length < 6) {
      throw new Error("Пароль должен быть не короче 6 символов");
    }

    const { data: existingRaw } = await axiosInstance.get<User[]>("/users", {
      params: { email: normalizedEmail },
    });
    const existing = ensureArray<User>(existingRaw);

    if (existing.length > 0) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const newUser = {
      id: String(Date.now()),
      email: normalizedEmail,
      password: normalizedPassword,
      name: name?.trim() || undefined,
    };

    const { data } = await axiosInstance.post<User>("/users", newUser);
    const { password: _, ...userWithoutPassword } = data;
    return userWithoutPassword;
  },

  logout: async (): Promise<void> => {
    return;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userId = getAuthToken();
    if (!userId) {
      return null;
    }

    try {
      const { data } = await axiosInstance.get<User>(`/users/${userId}`);
      if (!data?.id || !data.email) {
        deleteCookie(AUTH_COOKIE_NAME);
        return null;
      }
      const { password: _, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch {
      deleteCookie(AUTH_COOKIE_NAME);
      return null;
    }
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const email = data.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Укажите корректный email");
    }

    const { data: updatedUser } = await axiosInstance.patch<User>(
      `/users/${userId}`,
      {
        ...data,
        ...(email ? { email } : {}),
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      }
    );
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
};
