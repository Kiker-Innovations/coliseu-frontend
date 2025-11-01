/**
 * Concierge API Service
 * Handles all concierge-related API endpoints
 *
 * TODO: Implement endpoints as backend becomes available
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Concierge login request
 */
export interface ConciergeLoginRequest {
	email: string;
	password: string;
}

/**
 * Concierge login response
 */
export interface ConciergeLoginResponse {
	token: string;
	refreshToken: string;
	concierge: {
		id: string;
		email: string;
		name: string;
	};
}

/**
 * Package data
 */
export interface Package {
	id: string;
	recipientName: string;
	recipientApartment: string;
	trackingCode?: string;
	receivedAt: string;
	collectedAt?: string;
	notified: boolean;
}

/**
 * Package registration request
 */
export interface PackageRegisterRequest {
	recipientName: string;
	recipientApartment: string;
	trackingCode?: string;
}

/**
 * Fine data
 */
export interface Fine {
	id: string;
	residentId: string;
	apartmentNumber: string;
	amount: number;
	reason: string;
	status: "pending" | "paid" | "cancelled";
	createdAt: string;
}

/**
 * Concierge Service Class
 */
class ConciergeService {
	private readonly basePath = `/${API_CONFIG.version}/concierge`;

	/**
	 * Concierge login
	 * POST /v1/concierge/login
	 */
	async login(data: ConciergeLoginRequest): Promise<ApiResponse<ConciergeLoginResponse>> {
		return apiClient.post<ConciergeLoginResponse>(`${this.basePath}/login`, data);
	}

	/**
	 * Register new package
	 * POST /v1/concierge/packages
	 */
	async registerPackage(data: PackageRegisterRequest): Promise<ApiResponse<Package>> {
		return apiClient.post<Package>(`${this.basePath}/packages`, data);
	}

	/**
	 * Get all packages
	 * GET /v1/concierge/packages
	 */
	async getPackages(params?: {
		status?: "pending" | "collected";
		apartment?: string;
	}): Promise<ApiResponse<Package[]>> {
		return apiClient.get<Package[]>(`${this.basePath}/packages`, { params });
	}

	/**
	 * Mark package as collected
	 * PATCH /v1/concierge/packages/:id/collect
	 */
	async collectPackage(id: string): Promise<ApiResponse<Package>> {
		return apiClient.patch<Package>(`${this.basePath}/packages/${id}/collect`);
	}

	/**
	 * Notify resident about package arrival
	 * POST /v1/concierge/packages/:id/notify
	 */
	async notifyPackageArrival(id: string): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`${this.basePath}/packages/${id}/notify`);
	}

	/**
	 * Register fine
	 * POST /v1/concierge/fines
	 */
	async registerFine(data: Omit<Fine, "id" | "createdAt" | "status">): Promise<ApiResponse<Fine>> {
		return apiClient.post<Fine>(`${this.basePath}/fines`, data);
	}

	/**
	 * Get all fines
	 * GET /v1/concierge/fines
	 */
	async getFines(params?: {
		apartment?: string;
		status?: string;
	}): Promise<ApiResponse<Fine[]>> {
		return apiClient.get<Fine[]>(`${this.basePath}/fines`, { params });
	}

	// TODO: Add more concierge endpoints as needed:
	// - Visitor management
	// - Access control
	// - Incident reports
	// - Dashboard statistics
}

// Export singleton instance
export const conciergeService = new ConciergeService();
