import axiosInstance from "./axios";
import { User } from "@app/types/user";
import { getCookie } from "@shared/utils/cookie";

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const { data: users } = await axiosInstance.get<User[]>("/users", {
      params: { email, password },
    });

    const user = users[0];
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  register: async (
    email: string,
    password: string,
    name?: string
  ): Promise<User> => {
    const { data: existing } = await axiosInstance.get<User[]>("/users", {
      params: { email },
    });

    if (existing.length > 0) {
      throw new Error("User with this email already exists");
    }

    const newUser = {
      id: String(Date.now()),
      email,
      password,
      name,
    };

    const { data } = await axiosInstance.post<User>("/users", newUser);
    const { password: _, ...userWithoutPassword } = data;
    return userWithoutPassword;
  },

  logout: async (): Promise<void> => {
    return;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userId = getCookie("token");
    if (!userId) {
      return null;
    }

    try {
      const { data } = await axiosInstance.get<User>(`/users/${userId}`);
      const { password: _, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch {
      return null;
    }
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const { data: updatedUser } = await axiosInstance.patch<User>(
      `/users/${userId}`,
      data
    );
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
};
