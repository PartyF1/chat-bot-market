import axiosInstance from "./axios";
import { Order } from "@app/types/order";
import { getCookie } from "@shared/utils/cookie";

const requireAuth = () => {
  const token = getCookie("token");
  if (!token) {
    throw new Error("Unauthorized");
  }
  return token;
};

export const ordersApi = {
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    requireAuth();
    const { data } = await axiosInstance.get<Order[]>("/orders", {
      params: { userId },
    });
    return data;
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    requireAuth();
    try {
      const { data } = await axiosInstance.get<Order>(`/orders/${orderId}`);
      return data;
    } catch {
      return null;
    }
  },

  createOrder: async (
    userId: string,
    items: Order["items"],
    totalPrice: number,
    totalOldPrice?: number
  ): Promise<Order> => {
    requireAuth();

    const newOrder = {
      id: String(Date.now()),
      userId,
      items,
      totalPrice,
      totalOldPrice,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data } = await axiosInstance.post<Order>("/orders", newOrder);
    return data;
  },

  completeOrder: async (orderId: string): Promise<Order> => {
    requireAuth();
    const { data } = await axiosInstance.patch<Order>(`/orders/${orderId}`, {
      status: "completed",
      updatedAt: new Date().toISOString(),
    });
    return data;
  },

  getOrdersBySellerId: async (sellerId: string): Promise<Order[]> => {
    requireAuth();
    const { data } = await axiosInstance.get<Order[]>("/orders");
    return data.filter((order) =>
      order.items.some((item) => item.bot.ownerId === sellerId)
    );
  },
};
