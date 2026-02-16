/**
 * Project Suggestions API Service
 * Handles all project suggestions-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Project Suggestion status
 */
export type ProjectSuggestionStatus = "AGUARDANDO_VOTACAO" | "EM_VOTACAO" | "VOTACAO_ENCERRADA";

/**
 * Project Suggestion data structure from API
 */
export interface ProjectSuggestion {
	_id: string;
	buildingId: string;
	seasonId: string;
	title: string;
	description: string;
	duplicateCount: number;
	rank: number;
	votes: number;
	votingStartDate: string | null;
	votingEndDate: string | null;
	status: ProjectSuggestionStatus;
	createdAt: string;
	updatedAt: string;
}

/**
 * Start voting request
 */
export interface StartVotingRequest {
	votingStartDate: string;
	votingEndDate: string;
}

/**
 * Create projects request
 */
export interface CreateProjectsRequest {
	suggestionIds: string[];
}

/**
 * Created project response
 */
export interface CreatedProjectFromSuggestion {
	id: string;
	title: string;
	description: string;
	votes: number;
	rank: number;
}

/**
 * Vote response
 */
export interface VoteResponse {
	id: string;
	projectSuggestionId: string;
	voteCount: number;
}

/**
 * My vote data structure
 */
export interface MyVote {
	projectSuggestionId: string;
	voteCount: number;
}

/**
 * Helper function to check if voting period is truly active (checks dates too).
 * Returns false if the end date has passed even if the status is still EM_VOTACAO.
 * Returns false if the start date hasn't arrived yet (scheduled state).
 */
export function isVotingActive(suggestion: ProjectSuggestion): boolean {
	if (suggestion.status !== "EM_VOTACAO") return false;

	const now = new Date();

	// If start date is in the future, voting hasn't started yet (scheduled)
	if (suggestion.votingStartDate && now < new Date(suggestion.votingStartDate)) {
		return false;
	}

	// If end date has passed, voting has expired
	if (suggestion.votingEndDate && now > new Date(suggestion.votingEndDate)) {
		return false;
	}

	return true;
}

/**
 * Helper function to check if voting period has ended.
 * Returns true if status is VOTACAO_ENCERRADA, OR if status is still EM_VOTACAO
 * but the end date has already passed (time-expired).
 */
export function isVotingEnded(suggestion: ProjectSuggestion): boolean {
	if (suggestion.status === "VOTACAO_ENCERRADA") return true;

	// Also treat as ended if the voting end date has passed
	if (suggestion.status === "EM_VOTACAO" && suggestion.votingEndDate) {
		return new Date() > new Date(suggestion.votingEndDate);
	}

	return false;
}

/**
 * Helper function to check if voting has started
 */
export function hasVotingStarted(suggestion: ProjectSuggestion): boolean {
	return suggestion.status === "EM_VOTACAO" || suggestion.status === "VOTACAO_ENCERRADA";
}

/**
 * Helper function to check if waiting for voting
 */
export function isWaitingForVoting(suggestion: ProjectSuggestion): boolean {
	if (suggestion.status === "AGUARDANDO_VOTACAO") return true;

	// Also treat as waiting if status is EM_VOTACAO but start date is in the future (scheduled)
	if (suggestion.status === "EM_VOTACAO" && suggestion.votingStartDate) {
		return new Date() < new Date(suggestion.votingStartDate);
	}

	return false;
}

/**
 * Helper function to check if voting is time-expired but status hasn't been updated yet.
 * Useful for showing a distinct "expired" badge vs. officially "ended".
 */
export function isVotingTimeExpired(suggestion: ProjectSuggestion): boolean {
	if (suggestion.status !== "EM_VOTACAO") return false;
	if (!suggestion.votingEndDate) return false;
	return new Date() > new Date(suggestion.votingEndDate);
}

/**
 * Project Suggestions Service Class
 */
class ProjectSuggestionsService {
	private readonly basePath = `/${API_CONFIG.version}/project-suggestions`;
	private readonly seasonsBasePath = `/${API_CONFIG.version}/seasons`;

	/**
	 * Get authentication token for resident
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
	 * Get all project suggestions for a season
	 * GET /v1/seasons/:seasonId/project-suggestions
	 */
	async getProjectSuggestions(seasonId: string): Promise<ApiResponse<ProjectSuggestion[]>> {
		const response = await apiClient.get<ProjectSuggestion[]>(
			`${this.seasonsBasePath}/${seasonId}/project-suggestions`,
		);
		return {
			...response,
			data: response.data || [],
		};
	}

	/**
	 * Get project suggestion by ID
	 * GET /v1/project-suggestions/:id
	 */
	async getProjectSuggestionById(suggestionId: string): Promise<ApiResponse<ProjectSuggestion>> {
		return apiClient.get<ProjectSuggestion>(`${this.basePath}/${suggestionId}`);
	}

	/**
	 * Register or update vote for a project suggestion
	 * POST /v1/project-suggestions/vote
	 */
	async vote(projectSuggestionId: string, voteCount: number): Promise<ApiResponse<VoteResponse>> {
		this.ensureToken(true);
		return apiClient.post<VoteResponse>(`${this.basePath}/vote`, {
			projectSuggestionId,
			voteCount,
		});
	}

	/**
	 * Remove vote from a project suggestion
	 * DELETE /v1/project-suggestions/:projectSuggestionId/vote
	 */
	async removeVote(projectSuggestionId: string): Promise<ApiResponse<null>> {
		this.ensureToken(true);
		return apiClient.delete<null>(`${this.basePath}/${projectSuggestionId}/vote`);
	}

	/**
	 * Get my votes for a season
	 * GET /v1/seasons/:seasonId/project-suggestions/my-votes
	 */
	async getMyVotes(seasonId: string): Promise<ApiResponse<MyVote[]>> {
		this.ensureToken(true);
		return apiClient.get<MyVote[]>(
			`${this.seasonsBasePath}/${seasonId}/project-suggestions/my-votes`,
		);
	}
}

// Export singleton instance
export const projectSuggestionsService = new ProjectSuggestionsService();
