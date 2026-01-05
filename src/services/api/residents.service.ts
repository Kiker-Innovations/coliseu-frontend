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
	buildingId: string;
	apartmentId: string;
	name: string;
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
 * Resident confirm email request
 */
export interface ResidentConfirmRequest {
	email: string;
	code: string;
}

/**
 * Resident confirm email response
 */
export interface ResidentConfirmResponse {
	message: string;
}

/**
 * Resident forget password request
 */
export interface ResidentForgetPasswordRequest {
	email: string;
}

/**
 * Resident forget password response
 */
export interface ResidentForgetPasswordResponse {
	message: string;
}

/**
 * Resident reset password request
 */
export interface ResidentResetPasswordRequest {
	email: string;
	code: string;
	newPassword: string;
}

/**
 * Resident reset password response
 */
export interface ResidentResetPasswordResponse {
	message: string;
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
	 * Confirm resident email
	 * POST /v1/residents/confirm
	 */
	async confirmEmail(data: ResidentConfirmRequest): Promise<ApiResponse<ResidentConfirmResponse>> {
		return apiClient.post<ResidentConfirmResponse>(`${this.basePath}/confirm`, data);
	}

	/**
	 * Request password reset (forget password)
	 * POST /v1/residents/forget-password
	 */
	async forgetPassword(
		data: ResidentForgetPasswordRequest,
	): Promise<ApiResponse<ResidentForgetPasswordResponse>> {
		return apiClient.post<ResidentForgetPasswordResponse>(`${this.basePath}/forget-password`, data);
	}

	/**
	 * Reset password with code
	 * POST /v1/residents/reset-password
	 */
	async resetPassword(
		data: ResidentResetPasswordRequest,
	): Promise<ApiResponse<ResidentResetPasswordResponse>> {
		return apiClient.post<ResidentResetPasswordResponse>(`${this.basePath}/reset-password`, data);
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
	 * Get current resident profile
	 * GET /v1/residents/me
	 */
	async getCurrentResident(): Promise<ApiResponse<Resident>> {
		return apiClient.get<Resident>(`${this.basePath}/me`);
	}

	/**
	 * Get user ID from token
	 */
	private getUserIdFromToken(): string | null {
		const token =
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token");

		if (token) {
			try {
				const tokenParts = token.split(".");
				if (tokenParts.length === 3) {
					const payload = JSON.parse(atob(tokenParts[1]));
					return payload.id || payload._id || payload.userId || payload.user_id || null;
				}
			} catch (e) {
				console.error("Erro ao decodificar token:", e);
			}
		}
		return null;
	}

	/**
	 * Get resident profile
	 * GET /v1/residents/me
	 */
	async getProfile(): Promise<ApiResponse<{
		id?: string;
		_id?: string;
		email: string;
		name: string;
		phone?: string;
		photoUrl?: string | null;
		apartmentNumber?: string;
		buildingName?: string;
		buildingId?: string;
		apartmentId?: string;
		apartment?: {
			number?: string;
			block?: string;
			floor?: number;
		};
		apartmentBlock?: string;
		apartmentFloor?: number;
	}>> {
		return apiClient.get<{
			id?: string;
			_id?: string;
			email: string;
			name: string;
			phone?: string;
			photoUrl?: string | null;
			apartmentNumber?: string;
			buildingName?: string;
			buildingId?: string;
			apartmentId?: string;
			apartment?: {
				number?: string;
				block?: string;
				floor?: number;
			};
			apartmentBlock?: string;
			apartmentFloor?: number;
		}>(`${this.basePath}/me`);
	}

	/**
	 * Update resident profile
	 * PUT /v1/residents/{id}
	 */
	async updateProfile(data: {
		name?: string;
		email?: string;
		phone?: string;
		photoUrl?: string;
		buildingId?: string;
		apartmentId?: string;
	}): Promise<ApiResponse<{
		id: string;
		email: string;
		name: string;
		phone?: string;
		photoUrl?: string | null;
		status?: string;
		createdAt?: string;
		updatedAt?: string;
	}>> {
		const userId = this.getUserIdFromToken();
		if (!userId) {
			throw new Error("Não foi possível obter o ID do usuário do token");
		}

		return apiClient.put<{
			id: string;
			email: string;
			name: string;
			phone?: string;
			photoUrl?: string | null;
			status?: string;
			createdAt?: string;
			updatedAt?: string;
		}>(`${this.basePath}/${userId}`, data);
	}

	/**
	 * Get presigned URL for photo upload
	 * POST /v1/residents/{id}/photo/presigned-url
	 */
	async getPhotoPresignedUrl(data: {
		fileName?: string;
		fileSize?: number;
		contentType?: string;
		fileExtension?: string;
	}): Promise<ApiResponse<{
		presignedUrl: string;
		photoUrl: string;
		s3Key?: string;
		instructions?: string;
		expiresIn?: string;
	}>> {
		const userId = this.getUserIdFromToken();
		if (!userId) {
			throw new Error("Não foi possível obter o ID do usuário do token");
		}

		// Extrair extensão do arquivo do fileName ou usar fileExtension
		let fileExtension = data.fileExtension;
		if (!fileExtension && data.fileName) {
			const match = data.fileName.match(/\.([^.]+)$/);
			fileExtension = match ? match[1].toLowerCase() : "jpg";
		}
		if (!fileExtension) {
			// Tentar inferir do contentType
			if (data.contentType?.includes("jpeg") || data.contentType?.includes("jpg")) {
				fileExtension = "jpg";
			} else if (data.contentType?.includes("png")) {
				fileExtension = "png";
			} else {
				fileExtension = "jpg"; // Default
			}
		}

		return apiClient.post<{
			presignedUrl: string;
			photoUrl: string;
			s3Key?: string;
			instructions?: string;
			expiresIn?: string;
		}>(`${this.basePath}/${userId}/photo/presigned-url`, {
			fileExtension,
		});
	}

	/**
	 * Change resident password
	 * POST /v1/residents/me/password
	 */
	async changePassword(data: {
		currentPassword: string;
		newPassword: string;
		confirmPassword: string;
	}): Promise<ApiResponse<null>> {
		const userId = this.getUserIdFromToken();
		if (!userId) {
			throw new Error("Não foi possível obter o ID do usuário do token");
		}

		return apiClient.post<null>(`${this.basePath}/me/password`, data);
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
