/**
 * Season API Service
 * Handles all season-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Suggestion from residents
 */
export interface Suggestion {
	id: string;
	title: string;
	description: string;
	votes: number;
	residentId: string;
	residentName: string;
	createdAt: string;
}

/**
 * Top suggestion with ranking
 */
export interface TopSuggestion {
	id: string;
	title: string;
	description: string;
	votes: number;
	rank: number;
	residentName: string;
}

/**
 * Season data
 */
export interface Season {
	id: string;
	buildingId: string;
	status: "ACTIVE" | "FINISHED";
	reusedSuggestions: boolean;
	startDate: string;
	endDate?: string;
	createdAt: string;
	updatedAt: string;
	topSuggestions?: TopSuggestion[];
}

/**
 * Create season request
 */
export interface CreateSeasonRequest {
	reusedSuggestions: boolean;
}

/**
 * Create season response
 */
export interface CreateSeasonResponse {
	id: string;
	buildingId: string;
	status: "ACTIVE";
	reusedSuggestions: boolean;
	startDate: string;
	createdAt: string;
}

/**
 * Finish season response
 */
export interface FinishSeasonResponse {
	id: string;
	status: "FINISHED";
	endDate: string;
}

/**
 * Season Service Class
 */
class SeasonService {
	private readonly basePath = `/${API_CONFIG.version}/seasons`;

	/**
	 * Create a new season
	 * POST /v1/seasons
	 */
	async createSeason(data: CreateSeasonRequest): Promise<ApiResponse<CreateSeasonResponse>> {
		return apiClient.post<CreateSeasonResponse>(this.basePath, data);
	}

	/**
	 * Get all seasons for the building
	 * GET /v1/seasons
	 */
	async getSeasons(): Promise<ApiResponse<Season[]>> {
		return apiClient.get<Season[]>(this.basePath);
	}

	/**
	 * Get season by ID
	 * GET /v1/seasons/:id
	 */
	async getSeasonById(seasonId: string): Promise<ApiResponse<Season>> {
		return apiClient.get<Season>(`${this.basePath}/${seasonId}`);
	}

	/**
	 * Finish a season
	 * PATCH /v1/seasons/:id/finish
	 */
	async finishSeason(seasonId: string): Promise<ApiResponse<FinishSeasonResponse>> {
		return apiClient.patch<FinishSeasonResponse>(`${this.basePath}/${seasonId}/finish`);
	}
}

// Export singleton instance
export const seasonService = new SeasonService();
