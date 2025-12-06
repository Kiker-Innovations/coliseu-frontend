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
	id?: number;
	description: string;
	votes: number;
	percent: number;
}

/**
 * Active poll response
 */
export interface ActivePoll {
	id?: string;
	_id?: string;
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
	id?: string;
	_id?: string;
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
 * Get polls query parameters
 */
export interface GetPollsParams {
	buildingId: string;
	month?: number;
	year?: number;
	status?: string | string[]; // Can be single status or array of statuses (e.g., "ATIVO" or ["ATIVO", "PROGRAMADO"])
}

/**
 * Get active polls query parameters (deprecated - use GetPollsParams instead)
 */
export interface GetActivePollsParams {
	buildingId: string;
	month?: number;
	year?: number;
}

/**
 * Get finished/cancelled polls query parameters (deprecated - use GetPollsParams instead)
 */
export interface GetFinishedCancelledPollsParams {
	buildingId: string;
	month?: number;
	year?: number;
}

/**
 * Cancel poll request
 */
export interface CancelPollRequest {
	cancelReason: string;
}

/**
 * Cancel poll response
 */
export interface CancelPollResponse {
	id: string;
	description: string;
	status: string;
	cancelReason: string;
	cancelledAt: string;
}

/**
 * Vote poll request
 */
export interface VotePollRequest {
	pollId: string;
	optionId: number | null; // null indicates vote removal
	residentId?: string; // Optional, but backend extracts userId from JWT token, so not needed in body
}

/**
 * Vote poll response
 */
export interface VotePollResponse {
	id: string;
	pollId: string;
	optionId: number;
	createdAt: string;
}

/**
 * Get my vote for a specific poll response
 */
export interface GetMyVoteResponse {
	id: string;
	pollId: string;
	optionId: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Helper function to normalize date from MongoDB format
 */
function normalizeDate(date: any): string {
	if (typeof date === "string") {
		return date;
	}
	if (date && typeof date === "object" && "$date" in date) {
		return date.$date;
	}
	if (date instanceof Date) {
		return date.toISOString();
	}
	return "";
}

/**
 * Helper function to normalize poll data from API response
 */
function normalizePoll<T extends ActivePoll | FinishedCancelledPoll>(poll: any): T {
	if (!poll || typeof poll !== "object") {
		throw new Error("Invalid poll data");
	}

	return {
		...poll,
		id: poll.id || poll._id || "",
		_id: poll._id || poll.id || "",
		description: poll.description || "",
		startDate: normalizeDate(poll.startDate),
		endDate: normalizeDate(poll.endDate),
		votes: poll.votes || 0,
		status: poll.status || "",
		options: Array.isArray(poll.options)
			? poll.options.map((opt: any) => ({
					id: opt.id !== undefined ? opt.id : null,
					description: opt.description || "",
					votes: opt.votes || 0,
					percent: opt.percent || 0,
				}))
			: [],
	} as T;
}

/**
 * Polls Service Class
 */
class PollsService {
	private readonly basePath = `/${API_CONFIG.version}/polls`;

	/**
	 * Get authentication token
	 * Uses only the standard coliseu_access_token
	 */
	private getAuthToken(): string | null {
		return (
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
	 * Create a new poll
	 * POST /v1/polls
	 */
	async createPoll(data: CreatePollRequest): Promise<ApiResponse<CreatePollResponse>> {
		return apiClient.post<CreatePollResponse>(this.basePath, data);
	}

	/**
	 * Get polls with optional status filter
	 * GET /v1/polls
	 * @param params - Query parameters including buildingId, month, year, and status(es)
	 */
	async getPolls(params: GetPollsParams): Promise<ApiResponse<ActivePoll[]>> {
		// Validate buildingId
		if (!params.buildingId || typeof params.buildingId !== "string" || params.buildingId.trim() === "") {
			console.error("Invalid buildingId provided to getPolls:", params.buildingId);
			throw new Error("buildingId é obrigatório e deve ser uma string válida");
		}

		const queryParams: Record<string, string | number | string[]> = {
			buildingId: params.buildingId.trim(),
		};
		
		if (params.month !== undefined && params.month !== null && !isNaN(params.month) && params.month > 0 && params.month <= 12) {
			queryParams.month = params.month;
		}
		
		if (params.year !== undefined && params.year !== null && !isNaN(params.year) && params.year > 0) {
			queryParams.year = params.year;
		}

		// Handle status parameter - can be string or array
		// For arrays, we'll pass them directly so buildURL can create multiple params
		if (params.status !== undefined && params.status !== null) {
			if (Array.isArray(params.status)) {
				queryParams.status = params.status;
			} else if (typeof params.status === "string" && params.status.trim() !== "") {
				queryParams.status = [params.status.trim()];
			}
		}

		console.log("getPolls - Query params:", queryParams);
		
		const response = await apiClient.get<any[]>(this.basePath, {
			params: queryParams,
		});

		// Normalize the response data
		if (response.success && response.data) {
			try {
				const normalizedData = Array.isArray(response.data)
					? response.data.map((poll: any) => normalizePoll<ActivePoll>(poll))
					: [];
				return {
					...response,
					data: normalizedData,
				};
			} catch (error) {
				console.error("Error normalizing polls:", error);
				return {
					...response,
					data: [],
				};
			}
		}

		return {
			...response,
			data: [],
		} as ApiResponse<ActivePoll[]>;
	}

	/**
	 * Get all active polls
	 * GET /v1/polls/active (deprecated - use getPolls with status=["ATIVO", "PROGRAMADO"] instead)
	 */
	async getActivePolls(
		params: GetActivePollsParams,
	): Promise<ApiResponse<ActivePoll[]>> {
		// Use the new getPolls method with active statuses
		return this.getPolls({
			buildingId: params.buildingId,
			month: params.month,
			year: params.year,
			status: ["ATIVO", "PROGRAMADO"],
		});
	}

	/**
	 * Get all finished and cancelled polls
	 * GET /v1/polls/finished-cancelled (deprecated - use getPolls with status=["FINALIZADA", "CANCELADA"] instead)
	 */
	async getFinishedCancelledPolls(
		params: GetFinishedCancelledPollsParams,
	): Promise<ApiResponse<FinishedCancelledPoll[]>> {
		// Use the new getPolls method with appropriate statuses
		return this.getPolls({
			buildingId: params.buildingId,
			month: params.month,
			year: params.year,
			status: ["FINALIZADA", "CANCELADA"],
		}) as Promise<ApiResponse<FinishedCancelledPoll[]>>;
	}

	/**
	 * Cancel a poll
	 * DELETE /v1/polls/{id}/cancel
	 */
	async cancelPoll(
		pollId: string,
		data: CancelPollRequest,
	): Promise<ApiResponse<CancelPollResponse>> {
		// DELETE with body
		return apiClient.delete<CancelPollResponse>(
			`${this.basePath}/${pollId}/cancel`,
			{
				body: JSON.stringify(data),
			},
		);
	}

	/**
	 * Vote in a poll
	 * POST /v1/polls/vote
	 * The backend extracts the resident ID from the JWT token in the Authorization header
	 */
	async votePoll(data: VotePollRequest): Promise<ApiResponse<VotePollResponse>> {
		this.ensureToken(true);
		
		// Remove residentId from data if present, as backend extracts it from token
		const { residentId, ...voteData } = data;
		
		return apiClient.post<VotePollResponse>(`${this.basePath}/vote`, voteData);
	}

	/**
	 * Cancel/Remove a vote from a poll
	 * DELETE /v1/polls/{pollId}/vote
	 * The backend extracts the resident ID from the JWT token in the Authorization header
	 */
	async cancelVote(pollId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
		this.ensureToken(true);
		return apiClient.delete<{ success: boolean; message: string }>(`${this.basePath}/${pollId}/vote`);
	}

	/**
	 * Get my vote for a specific poll
	 * GET /v1/polls/{pollId}/my-vote
	 * The backend extracts the resident ID from the JWT token in the Authorization header
	 */
	async getMyVote(pollId: string): Promise<ApiResponse<GetMyVoteResponse>> {
		this.ensureToken(true);
		return apiClient.get<GetMyVoteResponse>(`${this.basePath}/${pollId}/my-vote`);
	}
}

// Export singleton instance
export const pollsService = new PollsService();

