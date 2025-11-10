import axiosInstance from "./axios";
import { TemplateCardProps } from "@entities/TemplateCard/types";

export interface BotDetails {
  id: number;
  name: string;
  description: string;
  detailedDescription: string;
  price: number;
  category: string;
  tags: string[];
  features: string[];
  version: string;
  compatibility: string;
  supportContacts: string;
  averageRating: number;
  totalSales: number;
  previewImageUrl: string;
  demoVideoUrl: string;
  seller: {
    id: number;
    username: string;
    rating: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetTemplatesResponse {
  content: TemplateCardProps[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export class CatalogService {
  static async getTemplates(
    page: number = 0,
    size: number = 20,
    category?: string,
    sort?: string
  ): Promise<GetTemplatesResponse> {
    const params: Record<string, any> = {
      page,
      size,
    };
    if (category) {
      params.category = category;
    }
    if (sort) {
      params.sort = sort;
    }

    const response = await axiosInstance.get<GetTemplatesResponse>("/bots", {
      params,
    });
    return response.data;
  }

  static async getBotById(id: number): Promise<BotDetails> {
    const response = await axiosInstance.get<BotDetails>(`/bots/${id}`);
    return response.data;
  }
}
