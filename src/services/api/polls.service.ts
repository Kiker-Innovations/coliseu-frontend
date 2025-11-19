/**
 * Polls API Service
 * Handles all poll-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Poll option
 */
export interface PollOption {
	description: string;
	votes: number;
	percent: number;
}

/**
 * Active poll response
 */
export interface ActivePoll {
	description: string;
	startDate: string;
	endDate: string;
	votes: number;
	options: PollOption[];
	status: string;
}

/**
 * Finished/Cancelled poll response
 */
export interface FinishedCancelledPoll {
	description: string;
	startDate: string;
	endDate: string;
	votes: number;
	options: PollOption[];
	status: string;
	cancelReason?: string;
	cancelledAt?: string;
}

/**
 * Create poll request
 */
export interface CreatePollRequest {
	buildingId: string;
	description: string;
	options: string[];
	startDate: string;
	endDate: string;
}

/**
 * Create poll response
 */
export interface CreatePollResponse {
	id: string;
	description: string;
	status: string;
}

/**
 * Get active polls query parameters
 */
export interface GetActivePollsParams {
	buildingId: string;
	month?: number;
	year?: number;
}

/**
 * Get finished/cancelled polls query parameters
 */
export interface GetFinishedCancelledPollsParams {
	buildingId: string;
	month?: number;
	year?: number;
}

/**
 * Polls Service Class
 */
class PollsService {
	private readonly basePath = `/${API_CONFIG.version}/polls`;

	/**
	 * Create a new poll
	 * POST /v1/polls
	 */
	async createPoll(data: CreatePollRequest): Promise<ApiResponse<CreatePollResponse>> {
		return apiClient.post<CreatePollResponse>(this.basePath, data);
	}

	/**
	 * Get all active polls
	 * GET /v1/polls/active
	 */
	async getActivePolls(
		params: GetActivePollsParams,
	): Promise<ApiResponse<ActivePoll[]>> {
		return apiClient.get<ActivePoll[]>(`${this.basePath}/active`, {
			params: {
				buildingId: params.buildingId,
				...(params.month && { month: String(params.month) }),
				...(params.year && { year: String(params.year) }),
			},
		});
	}

	/**
	 * Get all finished and cancelled polls
	 * GET /v1/polls/finished-cancelled
	 */
	async getFinishedCancelledPolls(
		params: GetFinishedCancelledPollsParams,
	): Promise<ApiResponse<FinishedCancelledPoll[]>> {
		return apiClient.get<FinishedCancelledPoll[]>(
			`${this.basePath}/finished-cancelled`,
			{
				params: {
					buildingId: params.buildingId,
					...(params.month && { month: String(params.month) }),
					...(params.year && { year: String(params.year) }),
				},
			},
		);
	}
}

// Export singleton instance
export const pollsService = new PollsService();

