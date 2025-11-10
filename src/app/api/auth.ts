import { User } from "@app/types/user";
import { setCookie } from "@shared/utils/cookie";
import axiosInstance from "./axios";

export const authApi = {
  login: async (
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> => {
    const response = await axiosInstance.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    setCookie("token", response.data.token, 7);
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<User> => {
    const response = await axiosInstance.post<User>("/auth/register", {
      username,
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post<void>("/auth/logout");
    // The cookie deletion is handled by the axios interceptor on 401, but we can do it here too for explicit logout.
    // deleteCookie("token");
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await axiosInstance.get<User>("/users/profile");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      return null;
    }
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axiosInstance.put<User>("/users/profile", data);
    return response.data;
  },
};
