/**
 * Residents API Service
 * Handles all resident-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Resident registration request data
 */
export interface ResidentRegisterRequest {
	apartmentNumber: string;
	email: string;
	password: string;
	phone: string;
}

/**
 * Resident registration response data
 */
export interface ResidentRegisterResponse {
	email: string;
	apartmentNumber: string;
	phone: string;
	presignedUrl: string;
}

/**
 * Resident data
 */
export interface Resident {
	id: string;
	email: string;
	apartmentNumber: string;
	phone: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Residents Service Class
 */
class ResidentsService {
	private readonly basePath = `/${API_CONFIG.version}/residents`;

	/**
	 * Register a new resident
	 * POST /v1/residents
	 */
	async register(data: ResidentRegisterRequest): Promise<ApiResponse<ResidentRegisterResponse>> {
		return apiClient.post<ResidentRegisterResponse>(this.basePath, data);
	}

	/**
	 * Upload resident photo to presigned URL
	 * This is a separate call to S3 after registration
	 */
	async uploadPhoto(presignedUrl: string, photo: File): Promise<void> {
		const response = await fetch(presignedUrl, {
			method: "PUT",
			body: photo,
			headers: {
				"Content-Type": photo.type,
			},
		});

		if (!response.ok) {
			throw new Error("Falha ao fazer upload da foto");
		}
	}

	/**
	 * Get resident profile
	 * GET /v1/residents/:id
	 * (Prepared for future implementation)
	 */
	async getProfile(id: string): Promise<ApiResponse<Resident>> {
		return apiClient.get<Resident>(`${this.basePath}/${id}`);
	}

	/**
	 * Update resident profile
	 * PATCH /v1/residents/:id
	 * (Prepared for future implementation)
	 */
	async updateProfile(id: string, data: Partial<Resident>): Promise<ApiResponse<Resident>> {
		return apiClient.patch<Resident>(`${this.basePath}/${id}`, data);
	}

	/**
	 * Delete resident account
	 * DELETE /v1/residents/:id
	 * (Prepared for future implementation)
	 */
	async deleteAccount(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`${this.basePath}/${id}`);
	}
}

// Export singleton instance
export const residentsService = new ResidentsService();
