/**
 * Visits API Service
 * Handles all visit-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { ApiClientError } from "./client";
import type { ApiResponse } from "./types";

/**
 * Create visit request
 */
export interface CreateVisitRequest {
  visitorId: string;
  apartmentId?: string;
  note?: string;
}

/**
 * Visit data
 */
export interface Visit {
  _id: string;
  visitorId: string;
  apartmentId?: string;
  apartmentNumber?: string;
  apartmentFloor?: number;
  apartmentBlock?: string;
  note?: string;
  registeredBy: string;
  registeredAt: string;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recent visit data (includes visitor and apartment details)
 */
export interface RecentVisit {
  _id: string;
  visitorId: string;
  apartmentId?: string;
  note?: string;
  registeredBy: string;
  registeredAt: string;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
  visitor: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
  };
  apartment?: {
    _id: string;
    number: string;
    floor?: number;
    block?: string;
  };
}

/**
 * Get visits response (paginated)
 */
export interface GetVisitsResponse {
  data: Visit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get visits params
 */
export interface GetVisitsParams {
  page?: number;
  limit?: number;
}

/**
 * Visits Service Class
 */
class VisitsService {
  private readonly basePath = `/${API_CONFIG.version}/visits`;

  /**
   * Get authentication token for concierge
   */
  private getAuthToken(): string | null {
    return (
      localStorage.getItem("coliseu_access_token") ||
      sessionStorage.getItem("coliseu_access_token") ||
      localStorage.getItem("concierge_token") ||
      sessionStorage.getItem("concierge_token")
    );
  }

  /**
   * Create a new visit
   * Endpoint: POST /v1/visits
   */
  async createVisit(data: CreateVisitRequest): Promise<ApiResponse<Visit>> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const url = `${API_CONFIG.baseURL}${this.basePath}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        message: "Erro desconhecido",
      }));
      throw new ApiClientError(response.status, errorData);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Get visits by visitor ID
   * Endpoint: GET /v1/visits/visitor/:visitorId
   */
  async getVisitsByVisitorId(
    visitorId: string,
    params?: GetVisitsParams
  ): Promise<ApiResponse<GetVisitsResponse>> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const url = new URL(
      `${API_CONFIG.baseURL}${this.basePath}/visitor/${visitorId}`
    );

    if (params?.page !== undefined) {
      url.searchParams.append("page", String(params.page));
    }
    if (params?.limit !== undefined) {
      url.searchParams.append("limit", String(params.limit));
    }

    console.log("Buscando visitas - URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Resposta HTTP:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        message: "Erro desconhecido",
      }));
      console.error("Erro na resposta:", errorData);
      throw new ApiClientError(response.status, errorData);
    }

    const data = await response.json();
    console.log("Dados da API:", data);
    return data;
  }

  /**
   * Get recent visits
   * Endpoint: GET /v1/visits/recent
   */
  async getRecentVisits(limit: number = 10): Promise<ApiResponse<RecentVisit[]>> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const url = new URL(`${API_CONFIG.baseURL}${this.basePath}/recent`);
    url.searchParams.append("limit", String(limit));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        message: "Erro desconhecido",
      }));
      throw new ApiClientError(response.status, errorData);
    }

    const data = await response.json();
    return data;
  }
}

// Export singleton instance
export const visitsService = new VisitsService();

