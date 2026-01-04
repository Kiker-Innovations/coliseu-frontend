/**
 * Notices API Service
 * Handles all notice-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Notice data (from list endpoint)
 */
export interface Notice {
  _id: string;
  title: string;
  content: string;
  status: "ATIVO" | "INATIVO";
  createdAt: string;
}

/**
 * Notice data (from getById endpoint)
 */
export interface NoticeDetail {
  _id: string;
  buildingId: string;
  title: string;
  content: string;
  fileName: string;
  fileSize: number;
  url: string;
  mimeType: string;
  status: "ATIVO" | "INATIVO";
  createdAt: string;
}

/**
 * Create notice request data
 */
export interface CreateNoticeRequest {
  title: string;
  content: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status?: "ATIVO" | "INATIVO";
}

/**
 * Create notice response data
 */
export interface CreateNoticeResponse {
  _id: string;
  title: string;
  content: string;
  url: string;
  presignedUrl: string;
  status: "ATIVO" | "INATIVO";
  createdAt: string;
}

/**
 * Get notices query parameters
 */
export interface GetNoticesParams {
  status?: "ATIVO" | "INATIVO";
  page?: number;
  limit?: number;
}

/**
 * Paginated notices response
 */
export interface PaginatedNoticesResponse {
  data: Notice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Notices Service Class
 */
class NoticesService {
  private readonly basePath = `/${API_CONFIG.version}/notices`;

  /**
   * Create a new notice (Admin only)
   * POST /v1/notices
   */
  async create(
    data: CreateNoticeRequest
  ): Promise<ApiResponse<CreateNoticeResponse>> {
    return apiClient.post<CreateNoticeResponse>(this.basePath, data);
  }

  /**
   * Get all notices for the user's building
   * GET /v1/notices?status=ATIVO|INATIVO&page=1&limit=10
   */
  async getAll(
    params?: GetNoticesParams
  ): Promise<ApiResponse<PaginatedNoticesResponse>> {
    return apiClient.get<PaginatedNoticesResponse>(this.basePath, { params });
  }

  /**
   * Get notice by ID
   * GET /v1/notices/:id
   */
  async getById(id: string): Promise<ApiResponse<NoticeDetail>> {
    return apiClient.get<NoticeDetail>(`${this.basePath}/${id}`);
  }

  /**
   * Delete notice (Admin only)
   * DELETE /v1/notices/:id
   */
  async delete(
    id: string,
    deletedNote: string
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`, {
      body: JSON.stringify({ deletedNote }),
    });
  }

  /**
   * Upload notice file to presigned URL
   * This is a separate call to S3 after creating the notice
   */
  async uploadFile(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao fazer upload do arquivo");
    }
  }
}

// Export singleton instance
export const noticesService = new NoticesService();

