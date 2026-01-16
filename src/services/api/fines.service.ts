/**
 * Fines API Service
 * Handles all fine-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Fine data
 */
export interface Fine {
	_id: string;
	buildingId: string;
	name: string;
	description: string;
	value: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Create Fine Request
 */
export interface CreateFineRequest {
	name: string;
	description: string;
	value: number;
}

/**
 * Update Fine Request
 */
export interface UpdateFineRequest {
	name?: string;
	description?: string;
	value?: number;
}

/**
 * Fines Service Class
 */
class FinesService {
	private readonly basePath = `/${API_CONFIG.version}/fines`;

	/**
	 * Get all fines
	 * GET /v1/fines
	 */
	async getAllFines(): Promise<Fine[]> {
		const response = await apiClient.get<Fine[]>(this.basePath);
		return Array.isArray(response.data) ? response.data : [];
	}

	/**
	 * Create fine
	 * POST /v1/fines
	 */
	async createFine(data: CreateFineRequest): Promise<Fine> {
		const response = await apiClient.post<Fine>(this.basePath, data);
		return response.data!;
	}

	/**
	 * Update fine
	 * PUT /v1/fines/:id
	 */
	async updateFine(id: string, data: UpdateFineRequest): Promise<Fine> {
		const response = await apiClient.put<Fine>(`${this.basePath}/${id}`, data);
		return response.data!;
	}

	/**
	 * Delete fine
	 * DELETE /v1/fines/:id
	 */
	async deleteFine(id: string): Promise<void> {
		await apiClient.delete<null>(`${this.basePath}/${id}`);
	}
}

// Export singleton instance
export const finesService = new FinesService();
