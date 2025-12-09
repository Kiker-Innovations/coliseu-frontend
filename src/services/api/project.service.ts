/**
 * Project API Service
 * Handles all project-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Offer data structure for a project
 */
export interface ProjectOffer {
  _id: string;
  companyName: string;
  description: string;
  companyCnpj: string;
  totalValue: number;
  installmentsCount: number;
  paidInstallments: number | null;
  votes: number;
  paymentStartDate: string | null;
}

/**
 * Full offer data structure from API
 */
export interface FullProjectOffer extends ProjectOffer {
  buildingId: string;
  seasonId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project data structure from API
 */
export interface Project {
  _id: string;
  buildingId: string;
  fromSeasonId: string;
  chosenOfferId: string | null;
  title: string;
  description: string;
  offerStartDate: string | null;
  offerEndDate: string | null;
  votes: number;
  rank: number | null;
  offer: ProjectOffer | Record<string, never>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vote offer response
 */
export interface VoteOfferResponse {
  voteId: string;
  offerId: string;
}

/**
 * My vote response
 */
export interface MyOfferVote {
  offerId: string | null;
}

/**
 * Offer option for creating offer poll
 */
export interface CreateOfferOption {
  companyName: string;
  description: string;
  companyCnpj: string;
  totalValue: number;
  installmentsCount: number;
}

/**
 * Request payload for creating offer poll
 */
export interface CreateOfferPollRequest {
  projectId: string;
  offerStartDate: string;
  offerEndDate: string;
  offers: CreateOfferOption[];
}

/**
 * Created offer response from API
 */
export interface CreatedOffer {
  _id: string;
  buildingId: string;
  seasonId: string;
  projectId: string;
  companyName: string;
  description: string;
  companyCnpj: string;
  totalValue: number;
  installmentsCount: number;
  paidInstallments: number | null;
  votes: number;
  paymentStartDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper function to check if a project has a chosen offer
 */
export function hasChosenOffer(project: Project): boolean {
  return (
    project.chosenOfferId !== null &&
    project.offer !== null &&
    Object.keys(project.offer).length > 0
  );
}

/**
 * Helper function to check if a project has an active offer poll
 */
export function hasActiveOfferPoll(project: Project): boolean {
  if (!project.offerStartDate || !project.offerEndDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(project.offerStartDate);
  const endDate = new Date(project.offerEndDate);

  return now >= startDate && now <= endDate;
}

/**
 * Helper function to check if offer poll has ended
 */
export function isOfferPollEnded(project: Project): boolean {
  if (!project.offerEndDate) {
    return false;
  }

  const now = new Date();
  const endDate = new Date(project.offerEndDate);

  return now > endDate;
}

/**
 * Project Service Class
 */
class ProjectService {
  private readonly basePath = `/${API_CONFIG.version}/projects`;
  private readonly offersBasePath = `/${API_CONFIG.version}/project-offers`;

  /**
   * Get all projects for the building
   * GET /v1/projects
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>(this.basePath);
  }

  /**
   * Get project by ID
   * GET /v1/projects/:id
   */
  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    return apiClient.get<Project>(`${this.basePath}/${projectId}`);
  }

  /**
   * Create offer poll for a project
   * POST /v1/project-offers
   */
  async createOfferPoll(
    data: CreateOfferPollRequest
  ): Promise<ApiResponse<CreatedOffer[]>> {
    return apiClient.post<CreatedOffer[]>(this.offersBasePath, data);
  }

  /**
   * Delete all offers from a project
   * DELETE /v1/project-offers/project/:projectId
   */
  async deleteProjectOffers(projectId: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(
      `${this.offersBasePath}/project/${projectId}`
    );
  }

  /**
   * Get all offers for a project
   * GET /v1/project-offers/project/:projectId
   */
  async getProjectOffers(
    projectId: string
  ): Promise<ApiResponse<FullProjectOffer[]>> {
    return apiClient.get<FullProjectOffer[]>(
      `${this.offersBasePath}/project/${projectId}`
    );
  }

  /**
   * Vote for a project offer
   * POST /v1/project-offers/vote
   */
  async voteOffer(offerId: string): Promise<ApiResponse<VoteOfferResponse>> {
    return apiClient.post<VoteOfferResponse>(`${this.offersBasePath}/vote`, {
      offerId,
    });
  }

  /**
   * Get my vote for a project
   * GET /v1/project-offers/project/:projectId/my-vote
   */
  async getMyOfferVote(projectId: string): Promise<ApiResponse<MyOfferVote>> {
    return apiClient.get<MyOfferVote>(
      `${this.offersBasePath}/project/${projectId}/my-vote`
    );
  }

  /**
   * Choose the winning offer for a project (admin only)
   * POST /v1/project-offers/project/:projectId/choose-winner
   */
  async chooseWinningOffer(
    projectId: string
  ): Promise<ApiResponse<FullProjectOffer>> {
    return apiClient.post<FullProjectOffer>(
      `${this.offersBasePath}/project/${projectId}/choose-winner`,
      {}
    );
  }
}

// Export singleton instance
export const projectService = new ProjectService();
