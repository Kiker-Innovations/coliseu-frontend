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
	top?: number;
}

/**
 * Created project response
 */
export interface CreatedProjectFromSuggestion {
	id: string;
	title: string;
	description: string;
	votes: number;
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
 * Helper function to check if voting period is active
 */
export function isVotingActive(suggestion: ProjectSuggestion): boolean {
	return suggestion.status === "EM_VOTACAO";
}

/**
 * Helper function to check if voting period has ended
 */
export function isVotingEnded(suggestion: ProjectSuggestion): boolean {
	return suggestion.status === "VOTACAO_ENCERRADA";
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
	return suggestion.status === "AGUARDANDO_VOTACAO";
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
