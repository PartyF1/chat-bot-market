import axiosInstance from "./axios";
import { Order } from "@app/types/order";
import { getAuthToken } from "@shared/utils/cookie";
import { ensureArray } from "@shared/utils/ensureArray";

const requireAuth = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Unauthorized");
  }
  return token;
};

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    items: ensureArray(order.items),
  };
}

export const ordersApi = {
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    requireAuth();
    const { data } = await axiosInstance.get<Order[]>("/orders", {
      params: { userId },
    });
    return ensureArray<Order>(data).map(normalizeOrder);
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    requireAuth();
    try {
      const { data } = await axiosInstance.get<Order>(`/orders/${orderId}`);
      return normalizeOrder(data);
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
      items: ensureArray(items),
      totalPrice,
      totalOldPrice,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data } = await axiosInstance.post<Order>("/orders", newOrder);
    return normalizeOrder(data);
  },

  completeOrder: async (orderId: string): Promise<Order> => {
    requireAuth();
    const { data } = await axiosInstance.patch<Order>(`/orders/${orderId}`, {
      status: "completed",
      updatedAt: new Date().toISOString(),
    });
    return normalizeOrder(data);
  },

  getOrdersBySellerId: async (sellerId: string): Promise<Order[]> => {
    requireAuth();
    const { data } = await axiosInstance.get<Order[]>("/orders");
    return ensureArray<Order>(data)
      .map(normalizeOrder)
      .filter((order) =>
        order.items.some((item) => item.bot?.ownerId === sellerId)
      );
  },
};
