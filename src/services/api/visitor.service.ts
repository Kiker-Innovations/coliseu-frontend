/**
 * Visitor API Service
 * Handles all visitor-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient, ApiClientError } from "./client";
import type { ApiResponse } from "./types";

/**
 * Create visitor request
 */
export interface CreateVisitorRequest {
	name: string;
	document?: string;
	phone?: string;
	email?: string;
	vehicleType?: string;
	vehiclePlate?: string;
	types: ("CONVIDADO" | "PRESTADOR")[]; // Tipos em maiúsculas conforme API
	companyName?: string; // Nome da empresa (para prestadores)
	note?: string;
	// conciergeId removed - backend extracts from token
	// photo removed - será enviado via presignedUrl separadamente
	// apartmentId removed - apartment is now linked to visit, not visitor
}

/**
 * Update visitor request
 */
export interface UpdateVisitorRequest {
	name?: string;
	document?: string;
	phone?: string;
	email?: string;
	vehicleType?: string;
	vehiclePlate?: string;
	types?: ("CONVIDADO" | "PRESTADOR")[];
	companyName?: string; // Nome da empresa (para prestadores)
	note?: string;
	active?: boolean;
	// apartmentId removed - apartment is now linked to visit, not visitor
}

/**
 * Create visitor response
 */
export interface CreateVisitorResponse {
	_id: string;
	name: string;
	email?: string;
	phone?: string;
	presignedUrl: string;
}

/**
 * Visitor data
 * Based on API response structure
 */
export interface Visitor {
	_id: string;
	name: string;
	email?: string;
	document?: string;
	phone?: string;
	vehicleType?: string;
	vehiclePlate?: string;
	apartmentId?: string;
	apartmentNumber?: string; // Número do apartamento retornado pela API
	types: ("CONVIDADO" | "PRESTADOR" | "convidado" | "prestador_servico")[]; // Aceita ambos os formatos
	companyName?: string; // Nome da empresa (para prestadores)
	photoUrl?: string;
	note?: string;
	registeredBy?: string;
	registeredAt?: string;
	updatedBy?: string;
	buildingId?: string;
	active?: boolean;
	createdAt?: string;
	updatedAt?: string;
	presignedUrl?: string; // URL presigned para upload de foto (retornado em create/update quando há nova foto)
}

/**
 * Get visitors params
 */
export interface GetVisitorsParams {
	page?: number;
	limit?: number;
	search?: string;
	filterBy?: "name" | "document" | "apartment";
}

/**
 * Get visitors response
 */
export interface GetVisitorsResponse {
	data: Visitor[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Visitor Service Class
 */
class VisitorService {
	private readonly basePath = `/${API_CONFIG.version}/visitors`;

	/**
	 * Get authentication token for concierge
	 * Checks coliseu_access_token first, then falls back to concierge_token
	 */
	private getAuthToken(): string | null {
		return (
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token") ||
			localStorage.getItem("concierge_token") ||
			sessionStorage.getItem("concierge_token") ||
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token")
		);
	}

	/**
	 * Ensure token is set in apiClient
	 * @param required - If true, throws error if token is not found
	 */
	private ensureToken(required: boolean = false): void {
		const token = this.getAuthToken();
		if (token) {
			apiClient.setAuthToken(token);
		} else if (required) {
			throw new Error("Token não encontrado. Faça login novamente.");
		}
	}

	/**
	 * Get all visitors with pagination and filters
	 *
	 * Endpoint: GET /v1/visitors
	 * Query Parameters:
	 *   - page: number (optional) - Page number (default: 1)
	 *   - limit: number (optional) - Items per page (default: 10, max: 100)
	 *   - search: string (optional) - Search term
	 *   - filterBy: "name" | "document" | "apartment" (optional) - Filter type
	 *
	 * Response structure:
	 * {
	 *   "success": true,
	 *   "message": "string",
	 *   "data": {
	 *     "data": Visitor[],
	 *     "total": number,
	 *     "page": number,
	 *     "limit": number,
	 *     "totalPages": number
	 *   }
	 * }
	 */
	async getVisitors(params?: GetVisitorsParams): Promise<ApiResponse<GetVisitorsResponse>> {
		this.ensureToken();

		// Construir query params como Record<string, string> para garantir que sejam strings
		// O Fastify parseia automaticamente números, então precisamos garantir que sejam strings
		const queryParams: Record<string, string> = {};

		if (params?.page !== undefined && params?.page !== null) {
			// Forçar como string adicionando "" para garantir que não seja parseado como número
			queryParams.page = String(params.page);
		}
		if (params?.limit !== undefined && params?.limit !== null) {
			queryParams.limit = String(params.limit);
		}
		if (params?.search) {
			queryParams.search = String(params.search);
		}
		if (params?.filterBy) {
			queryParams.filterBy = String(params.filterBy);
		}

		// Usar fetch diretamente para ter controle total sobre a URL
		const token = this.getAuthToken();
		if (!token) {
			throw new Error("Token não encontrado. Faça login novamente.");
		}

		// Construir URL completa com query params como strings
		const url = new URL(`${API_CONFIG.baseURL}${this.basePath}`);

		// Adicionar parâmetros como strings explicitamente usando URLSearchParams
		Object.entries(queryParams).forEach(([key, value]) => {
			url.searchParams.append(key, String(value));
		});

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

	/**
	 * Create a new visitor
	 * Endpoint: POST /v1/visitors
	 * Returns a presignedUrl for photo upload
	 */
	async createVisitor(data: CreateVisitorRequest): Promise<ApiResponse<CreateVisitorResponse>> {
		this.ensureToken(true);

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
	 * Upload visitor photo to presigned URL
	 * This is a separate call to S3 after creating visitor
	 */
	async uploadPhoto(presignedUrl: string, photo: File): Promise<void> {
		const response = await fetch(presignedUrl, {
			method: "PUT",
			body: photo,
			headers: {
				"Content-Type": photo.type,
			},
		});

		if (!response.ok) {
			throw new Error("Falha ao fazer upload da foto");
		}
	}

	/**
	 * Get latest visitors (no pagination)
	 * Endpoint: GET /v1/visitors/recent?limit=...
	 *
	 * @param limit - Maximum number of visitors to return
	 * @returns Array of visitors without pagination metadata
	 */
	async getLatestVisitors(limit: number = 10): Promise<ApiResponse<Visitor[]>> {
		this.ensureToken();

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

	/**
	 * Get visitor by ID
	 * Endpoint: GET /v1/visitors/:id
	 */
	async getVisitorById(id: string): Promise<ApiResponse<Visitor>> {
		this.ensureToken();

		const token = this.getAuthToken();
		if (!token) {
			throw new Error("Token não encontrado. Faça login novamente.");
		}

		const url = `${API_CONFIG.baseURL}${this.basePath}/${id}`;

		const response = await fetch(url, {
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

	/**
	 * Update visitor by ID
	 * Endpoint: PUT /v1/visitors/:id
	 */
	async updateVisitor(id: string, data: UpdateVisitorRequest): Promise<ApiResponse<Visitor>> {
		this.ensureToken(true);

		const token = this.getAuthToken();
		if (!token) {
			throw new Error("Token não encontrado. Faça login novamente.");
		}

		const url = `${API_CONFIG.baseURL}${this.basePath}/${id}`;

		const response = await fetch(url, {
			method: "PUT",
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
}

// Export singleton instance
export const visitorService = new VisitorService();
