import axiosInstance from "./axios";
import { TemplateCardProps } from "@entities/TemplateCard/types";

export interface BotDetails {
  id: string;
  title: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating: number;
  description: string;
  features: string;
  integrations: string[];
  advantages: string;
  tech: string;
  usage: string;
  createdAt: string;
  isActive: boolean;
  ownerId: string;
}

export interface TemplatesPage {
  items: TemplateCardProps[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

export class CatalogService {
  static async getTemplates(
    page: number = 1,
    pageSize: number = 10
  ): Promise<TemplatesPage> {
    const { data } = await axiosInstance.get<BotDetails[]>("/bots");
    const activeBots = data.filter((bot) => bot.isActive);
    const total = activeBots.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;
    const paginatedBots = activeBots.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedBots.map((bot) => ({
        id: bot.id,
        image: bot.image,
        title: bot.title,
        integrations: bot.integrations,
      })),
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : totalPages,
    };
  }

  static async getBotById(id: string): Promise<BotDetails> {
    const { data } = await axiosInstance.get<BotDetails>(`/bots/${id}`);
    return data;
  }

  static async createBot(
    botData: Omit<
      BotDetails,
      "id" | "createdAt" | "rating" | "image" | "advantages" | "tech"
    > & {
      image?: string;
      advantages?: string;
      tech?: string;
      rating?: number;
    }
  ): Promise<BotDetails> {
    const newBot: Omit<BotDetails, "id"> & { id?: string } = {
      id: String(Date.now()),
      title: botData.title || botData.name,
      name: botData.name,
      image: botData.image || DEFAULT_IMAGE,
      price: botData.price || 0,
      oldPrice: botData.oldPrice,
      rating: botData.rating || 0,
      description: botData.description || "",
      features: botData.features || "",
      integrations: botData.integrations || [],
      advantages: botData.advantages || "",
      tech: botData.tech || "",
      usage: botData.usage || "",
      createdAt: new Date().toISOString(),
      isActive: botData.isActive ?? true,
      ownerId: botData.ownerId,
    };

    const { data } = await axiosInstance.post<BotDetails>("/bots", newBot);
    return data;
  }

  static async getBotsByOwnerId(ownerId: string): Promise<BotDetails[]> {
    const { data } = await axiosInstance.get<BotDetails[]>("/bots", {
      params: { ownerId },
    });
    return data;
  }
}
