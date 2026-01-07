/**
 * Package API Service
 * Handles all package-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Create package request
 */
export interface CreatePackageRequest {
	ownerName?: string;
	apartmentId: string;
	description?: string;
	courierName?: string;
	receiverDate: string;
	// receiverConciergeId removed - backend extracts from token
}

/**
 * Create package response
 */
export interface CreatePackageResponse {
	id: string;
	ownerName: string;
	description: string;
}

/**
 * Pending package
 */
export interface PendingPackage {
	_id: string;
	ownerName: string;
	description: string;
	apartmentNumber: string;
	receiverDate: string;
	receiverBy: string;
	courierName?: string;
}

/**
 * Delivered package
 */
export interface DeliveredPackage {
	_id: string;
	ownerName: string;
	description: string;
	apartmentNumber: string;
	receiverDate?: string;
	deliveryDate: string;
	recipientName: string;
	deliveryBy: string;
	courierName?: string;
}

/**
 * Package data
 */
export interface Package {
	_id: string;
	apartmentId: string;
	receiverConciergeId: string;
	deliveryConciergeId?: string;
	ownerName: string;
	courierName?: string;
	recipientName?: string;
	description: string;
	receiverDate: string;
	deliveryDate?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	apartmentNumber?: string;
	receiverBy?: string;
	deliveryBy?: string;
}

/**
 * Confirm delivery request
 */
export interface ConfirmDeliveryRequest {
	recipientName?: string;
	// deliveryConciergeId removed - backend extracts from token
}

/**
 * Cancelled package
 */
export interface CancelledPackage {
	_id: string;
	ownerName: string;
	description: string;
	courierName?: string;
	apartmentNumber: string;
	receiverDate: string;
	cancelReason: string;
	cancelledConciergeId: string;
	cancelledAt: string;
	canceledBy: string;
}

/**
 * Cancel package request
 */
export interface CancelPackageRequest {
	cancelReason: string;
	// cancelledConciergeId removed - backend extracts from token
}

/**
 * Package statistics (concierge)
 */
export interface PackageStats {
	totalPendings: number;
	totalConfirmed: number;
	totalPendingsWeek: number;
}

/**
 * Resident's package
 */
export interface ResidentPackage {
	_id: string;
	apartmentId: string;
	buildingId: string;
	receiverBy: string;
	deliveryBy?: string;
	ownerName: string;
	courierName?: string;
	recipientName?: string;
	description?: string;
	receiverDate: string;
	deliveryDate?: string;
	status: string;
	cancelReason?: string;
	canceledBy?: string;
	cancelledAt?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Query parameters for resident packages
 */
export interface GetMyPackagesParams {
	status?: string;
}

/**
 * Query parameters for concierge packages list
 */
export interface GetPackagesParams {
	status: "PENDENTE" | "ENTREGUE" | "CANCELADO";
	days?: number;
}

/**
 * Concierge package from unified endpoint
 */
export interface ConciergePackage {
	_id: string;
	ownerName: string;
	description: string;
	courierName?: string;
	apartmentNumber: string;
	apartmentFloor?: number;
	apartmentBlock?: string;
	receiverDate: string;
	receiverBy: string;
	deliveryDate?: string;
	recipientName?: string;
	deliveryBy?: string;
	cancelReason?: string;
	canceledBy?: string;
	cancelledAt?: string;
}

/**
 * Resident package statistics
 */
export interface ResidentPackageStats {
	totalAguardandoRetiradaMes: number;
	totalEntregues: number;
	totalAguardandoRetirada: number;
}

/**
 * Package Service Class
 */
class PackageService {
	private readonly basePath = `/${API_CONFIG.version}/packages`;

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
	 * Create a new package
	 * POST /v1/packages
	 */
	async createPackage(data: CreatePackageRequest): Promise<ApiResponse<CreatePackageResponse>> {
		this.ensureToken(true);
		return apiClient.post<CreatePackageResponse>(this.basePath, data);
	}

	/**
	 * Get pending packages
	 * GET /v1/packages/pending
	 */
	async getPendingPackages(): Promise<ApiResponse<PendingPackage[]>> {
		this.ensureToken();
		const response = await apiClient.get<PendingPackage[]>(`${this.basePath}/pending`);
		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get delivered packages
	 * GET /v1/packages/delivered
	 */
	async getDeliveredPackages(): Promise<ApiResponse<DeliveredPackage[]>> {
		this.ensureToken();
		const response = await apiClient.get<DeliveredPackage[]>(`${this.basePath}/delivered`);
		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get package by ID
	 * GET /v1/packages/:id
	 */
	async getPackageById(id: string): Promise<ApiResponse<Package>> {
		this.ensureToken();
		const response = await apiClient.get<Package>(`${this.basePath}/${id}`);
		if (!response.success || !response.data) {
			throw new Error("Encomenda não encontrada");
		}
		return response;
	}

	/**
	 * Confirm package delivery
	 * PUT /v1/packages/:id/confirm-delivery
	 */
	async confirmPackageDelivery(
		id: string,
		data: ConfirmDeliveryRequest,
	): Promise<ApiResponse<Package>> {
		this.ensureToken(true);
		return apiClient.put<Package>(`${this.basePath}/${id}/confirm-delivery`, data);
	}

	/**
	 * Cancel package
	 * PUT /v1/packages/:id/cancel
	 */
	async cancelPackage(id: string, data: CancelPackageRequest): Promise<ApiResponse<Package>> {
		this.ensureToken(true);
		return apiClient.put<Package>(`${this.basePath}/${id}/cancel`, data);
	}

	/**
	 * Get cancelled packages
	 * GET /v1/packages/cancelled
	 * @deprecated Use getPackages with status="CANCELADA" instead
	 */
	async getCancelledPackages(days?: number): Promise<ApiResponse<CancelledPackage[]>> {
		this.ensureToken();
		const params = days ? { days: String(days) } : undefined;
		const response = await apiClient.get<CancelledPackage[]>(`${this.basePath}/cancelled`, {
			params,
		});
		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get packages with status filter (unified endpoint for concierge)
	 * GET /v1/packages?status=PENDENTE|ENTREGUE|CANCELADA&days=7
	 * @param params - Query parameters (status required, days optional - only for ENTREGUE and CANCELADA)
	 */
	async getPackages(params: GetPackagesParams): Promise<ApiResponse<ConciergePackage[]>> {
		this.ensureToken();

		const queryParams: Record<string, string> = {
			status: params.status,
		};

		// Only add days parameter for delivered and cancelled packages
		if (params.days && (params.status === "ENTREGUE" || params.status === "CANCELADO")) {
			queryParams.days = String(params.days);
		}

		const response = await apiClient.get<ConciergePackage[]>(this.basePath, {
			params: queryParams,
		});

		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get package statistics (concierge)
	 * GET /v1/packages/stats
	 */
	async getPackageStats(): Promise<ApiResponse<PackageStats>> {
		this.ensureToken();
		const response = await apiClient.get<PackageStats>(`${this.basePath}/stats`);
		if (!response.success || !response.data) {
			// Return default stats if request fails
			return {
				success: false,
				message: response.message || "Erro ao buscar estatísticas",
				data: {
					totalPendings: 0,
					totalConfirmed: 0,
					totalPendingsWeek: 0,
				},
			};
		}
		return response;
	}

	// ==================== RESIDENT ENDPOINTS ====================

	/**
	 * Get resident's packages
	 * GET /v1/packages/my-packages
	 * @param params - Optional query parameters (status filter)
	 */
	async getMyPackages(params?: GetMyPackagesParams): Promise<ApiResponse<ResidentPackage[]>> {
		this.ensureToken(true);

		const queryParams: Record<string, string> = {};
		if (params?.status) {
			queryParams.status = params.status;
		}

		const response = await apiClient.get<ResidentPackage[]>(`${this.basePath}/my-packages`, {
			params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		});

		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get resident's package statistics
	 * GET /v1/packages/my-packages/stats
	 */
	async getMyPackagesStats(): Promise<ApiResponse<ResidentPackageStats>> {
		this.ensureToken(true);

		const response = await apiClient.get<ResidentPackageStats>(
			`${this.basePath}/my-packages/stats`,
		);

		if (!response.success || !response.data) {
			// Return default stats if request fails
			return {
				success: false,
				message: response.message || "Erro ao buscar estatísticas",
				data: {
					totalAguardandoRetiradaMes: 0,
					totalEntregues: 0,
					totalAguardandoRetirada: 0,
				},
			};
		}

		return response;
	}
}

// Export singleton instance
export const packageService = new PackageService();
