/**
 * Season API Service
 * Handles all season-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Season data structure from API
 * Note: endDate === null means the season is active
 */
export interface Season {
	_id: string;
	buildingId: string;
	seasonNumber: number;
	reusedSuggestions: boolean;
	createdAt: string;
	updatedAt: string;
	endDate: string | null;
}

/**
 * Chosen offer for a suggestion
 */
export interface ChosenOffer {
	companyName: string;
	paidInstallments: number;
	totalInstallments: number;
	value: number;
	paymentStartDate: string | null;
	createdAt: string;
}

/**
 * Suggestion with voting and offer data
 */
export interface SuggestionWithOffer {
	_id: string;
	title: string;
	description: string;
	votes: number;
	rank: number;
	residentName: string;
	chosenOffer: ChosenOffer | null;
}

/**
 * Top suggestion with ranking (from active season)
 * @deprecated Use SuggestionWithOffer instead
 */
export interface TopSuggestion {
	_id: string;
	title: string;
	description: string;
	votes: number;
	rank: number;
	residentName: string;
}

/**
 * Create season request
 */
export interface CreateSeasonRequest {
	reusedSuggestions: boolean;
}

/**
 * Offer option for poll creation
 */
export interface OfferOption {
	companyName: string;
	totalInstallments: number;
	value: number;
}

/**
 * Create offer poll request
 */
export interface CreateOfferPollRequest {
	suggestionId: string;
	description: string;
	offers: OfferOption[];
	startDate: string;
	endDate: string;
}

/**
 * Helper function to check if a season is active
 * A season is active when endDate is null
 */
export function isSeasonActive(season: Season): boolean {
	return season.endDate === null;
}

/**
 * Helper function to check if a season is finished
 * A season is finished when endDate is not null
 */
export function isSeasonFinished(season: Season): boolean {
	return season.endDate !== null;
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
	async createSeason(data: CreateSeasonRequest): Promise<ApiResponse<Season>> {
		return apiClient.post<Season>(this.basePath, data);
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
	async finishSeason(seasonId: string): Promise<ApiResponse<Season>> {
		return apiClient.patch<Season>(`${this.basePath}/${seasonId}/finish`);
	}
}

// Export singleton instance
export const seasonService = new SeasonService();
