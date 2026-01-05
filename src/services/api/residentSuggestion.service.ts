/**
 * Resident Suggestion API Service
 * Handles all resident suggestion-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Resident suggestion data structure from API
 */
export interface ResidentSuggestion {
	_id: string;
	apartmentId: string;
	buildingId: string;
	fromSeasonId?: string;
	actualSeasonId?: string;
	title: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Create suggestion request
 */
export interface CreateSuggestionRequest {
	title: string;
	description: string;
}

/**
 * Update suggestion request
 */
export interface UpdateSuggestionRequest {
	title: string;
	description: string;
}

/**
 * Resident Suggestion Service Class
 */
class ResidentSuggestionService {
	private readonly basePath = `/${API_CONFIG.version}/resident-suggestions`;

	/**
	 * Get authentication token for resident
	 * Checks coliseu_access_token first, then falls back to other storages
	 */
	private getAuthToken(): string | null {
		return (
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token") ||
			null
		);
	}

	/**
	 * Ensure token is set in apiClient
	 * @param required - If true, throws error if token is not found
	 */
	private ensureToken(required = false): void {
		const token = this.getAuthToken();
		if (token) {
			apiClient.setAuthToken(token);
		} else if (required) {
			throw new Error("Token não encontrado. Faça login novamente.");
		}
	}

	/**
	 * Create a new suggestion
	 * POST /v1/resident-suggestions
	 */
	async createSuggestion(data: CreateSuggestionRequest): Promise<ApiResponse<ResidentSuggestion>> {
		this.ensureToken(true);
		return apiClient.post<ResidentSuggestion>(this.basePath, data);
	}

	/**
	 * Update an existing suggestion
	 * PUT /v1/resident-suggestions/:id
	 */
	async updateSuggestion(
		suggestionId: string,
		data: UpdateSuggestionRequest,
	): Promise<ApiResponse<ResidentSuggestion>> {
		this.ensureToken(true);
		return apiClient.put<ResidentSuggestion>(`${this.basePath}/${suggestionId}`, data);
	}

	/**
	 * Delete a suggestion
	 * DELETE /v1/resident-suggestions/:id
	 */
	async deleteSuggestion(suggestionId: string): Promise<ApiResponse<null>> {
		this.ensureToken(true);
		return apiClient.delete<null>(`${this.basePath}/${suggestionId}`);
	}

	/**
	 * Get suggestions by apartment
	 * GET /v1/resident-suggestions/apartment
	 */
	async getSuggestionsByApartment(): Promise<ApiResponse<ResidentSuggestion[]>> {
		this.ensureToken(true);
		const response = await apiClient.get<ResidentSuggestion[]>(`${this.basePath}/apartment`);
		return {
			...response,
			data: response.data || [],
		};
	}
}

// Export singleton instance
export const residentSuggestionService = new ResidentSuggestionService();
