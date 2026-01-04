/**
 * Admin API Service
 * Handles all admin-related API endpoints
 *
 * TODO: Implement endpoints as backend becomes available
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Admin login request
 */
export interface AdminLoginRequest {
	email: string;
	password: string;
}

/**
 * Admin login response
 */
export interface AdminLoginResponse {
	token: string;
	refreshToken: string;
	admin: {
		id: string;
		email: string;
		name: string;
		role: string;
	};
}

/**
 * Admin confirm email request
 */
export interface AdminConfirmRequest {
	email: string;
	code: string;
}

/**
 * Admin confirm email response
 */
export interface AdminConfirmResponse {
	message: string;
}

/**
 * Admin forget password request
 */
export interface AdminForgetPasswordRequest {
	email: string;
}

/**
 * Admin forget password response
 */
export interface AdminForgetPasswordResponse {
	message: string;
}

/**
 * Admin reset password request
 */
export interface AdminResetPasswordRequest {
	email: string;
	code: string;
	newPassword: string;
}

/**
 * Admin reset password response
 */
export interface AdminResetPasswordResponse {
	message: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
	totalResidents: number;
	totalPackages: number;
	pendingFines: number;
	activePolls: number;
}

/**
 * Notice data
 */
export interface Notice {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	author: string;
}

/**
 * Admin Service Class
 */
class AdminService {
	private readonly basePath = `/${API_CONFIG.version}/admins`;

	/**
	 * Admin login
	 * POST /v1/admin/login
	 */
	async login(data: AdminLoginRequest): Promise<ApiResponse<AdminLoginResponse>> {
		return apiClient.post<AdminLoginResponse>(`${this.basePath}/login`, data);
	}

	/**
	 * Confirm admin email
	 * POST /v1/admins/confirm
	 */
	async confirmEmail(data: AdminConfirmRequest): Promise<ApiResponse<AdminConfirmResponse>> {
		return apiClient.post<AdminConfirmResponse>(`/${API_CONFIG.version}/admins/confirm`, data);
	}

	/**
	 * Request password reset (forget password)
	 * POST /v1/admin/forget-password
	 */
	async forgetPassword(
		data: AdminForgetPasswordRequest,
	): Promise<ApiResponse<AdminForgetPasswordResponse>> {
		return apiClient.post<AdminForgetPasswordResponse>(`${this.basePath}/forget-password`, data);
	}

	/**
	 * Reset password with code
	 * POST /v1/admin/reset-password
	 */
	async resetPassword(
		data: AdminResetPasswordRequest,
	): Promise<ApiResponse<AdminResetPasswordResponse>> {
		return apiClient.post<AdminResetPasswordResponse>(`${this.basePath}/reset-password`, data);
	}

	/**
	 * Get dashboard statistics
	 * GET /v1/admin/dashboard
	 */
	async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
		return apiClient.get<DashboardStats>(`${this.basePath}/dashboard`);
	}

	/**
	 * Create notice
	 * POST /v1/admin/notices
	 */
	async createNotice(
		data: Omit<Notice, "id" | "createdAt" | "author">,
	): Promise<ApiResponse<Notice>> {
		return apiClient.post<Notice>(`${this.basePath}/notices`, data);
	}

	/**
	 * Get all notices
	 * GET /v1/admin/notices
	 */
	async getNotices(): Promise<ApiResponse<Notice[]>> {
		return apiClient.get<Notice[]>(`${this.basePath}/notices`);
	}

	/**
	 * Update notice
	 * PATCH /v1/admin/notices/:id
	 */
	async updateNotice(id: string, data: Partial<Notice>): Promise<ApiResponse<Notice>> {
		return apiClient.patch<Notice>(`${this.basePath}/notices/${id}`, data);
	}

	/**
	 * Delete notice
	 * DELETE /v1/admin/notices/:id
	 */
	async deleteNotice(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`${this.basePath}/notices/${id}`);
	}

	/**
	 * Get current admin profile
	 * GET /v1/admins/me
	 */
	async getCurrentAdmin(): Promise<ApiResponse<{
		_id: string;
		id: string;
		email: string;
		name: string;
		buildingId: string;
		role?: string;
	}>> {
		return apiClient.get<{
			_id: string;
			id: string;
			email: string;
			name: string;
			buildingId: string;
			role?: string;
		}>(`${this.basePath}/me`);
	}

	/**
	 * Get residents with pagination and filters
	 * GET /v1/admins/residents
	 */
	async getResidents(params?: {
		page?: number;
		limit?: number;
		search?: string;
		filterBy?: "name" | "phone" | "email" | "apartment";
		status?: "A_CONFIRMACAO_EMAIL" | "A_VALIDACAO" | "REJEITADO" | "ATIVO" | "INATIVO";
	}): Promise<ApiResponse<{
		data: Array<{
			_id: string;
			name: string;
			email: string;
			phone?: string;
			apartmentId?: string;
			apartmentNumber?: string;
			status: string;
		}>;
		total: number;
		totalPages: number;
	}>> {
		return apiClient.get<{
			data: Array<{
				_id: string;
				name: string;
				email: string;
				phone?: string;
				apartmentId?: string;
				apartmentNumber?: string;
				status: string;
			}>;
			total: number;
			totalPages: number;
		}>(`${this.basePath}/residents`, { params });
	}

	/**
	 * Get resident by ID with all details
	 * GET /v1/admins/residents/:id
	 */
	async getResidentById(id: string): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		phone: string;
		buildingId: string;
		apartmentId: string;
		status: string;
		photoUrl: string | null;
		residentCode: string;
		createdAt: string;
		updatedAt: string;
		apartment: {
			_id: string;
			number: string;
			block: string;
			floor: number;
			status: string;
		} | null;
	}>> {
		return apiClient.get<{
			_id: string;
			name: string;
			email: string;
			phone: string;
			buildingId: string;
			apartmentId: string;
			status: string;
			photoUrl: string | null;
			residentCode: string;
			createdAt: string;
			updatedAt: string;
			apartment: {
				_id: string;
				number: string;
				block: string;
				floor: number;
				status: string;
			} | null;
		}>(`${this.basePath}/residents/${id}`);
	}

	/**
	 * Count residents by building
	 * GET /v1/admins/residents/count
	 */
	async countResidents(): Promise<ApiResponse<number>> {
		return apiClient.get<number>(`${this.basePath}/residents/count`);
	}

	/**
	 * Approve resident (change status from A_VALIDACAO to ATIVO)
	 * POST /v1/admins/residents/:id/approve
	 */
	async approveResident(id: string): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		status: string;
	}>> {
		return apiClient.post<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>(`${this.basePath}/residents/${id}/approve`, {});
	}

	/**
	 * Reject resident (change status from A_VALIDACAO to REJEITADO)
	 * POST /v1/admins/residents/:id/reject
	 */
	async rejectResident(
		id: string,
		rejectType: string,
		rejectNote?: string,
	): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		status: string;
		rejectType: string;
		rejectNote?: string;
	}>> {
		return apiClient.post<{
			_id: string;
			name: string;
			email: string;
			status: string;
			rejectType: string;
			rejectNote?: string;
		}>(`${this.basePath}/residents/${id}/reject`, {
			rejectType,
			rejectNote,
		});
	}

	/**
	 * Deactivate resident (change status from ATIVO to INATIVO)
	 * POST /v1/admins/residents/:id/deactivate
	 */
	async deactivateResident(
		id: string,
		inactiveType: string,
		inactiveNote?: string,
	): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		status: string;
	}>> {
		return apiClient.post<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>(`${this.basePath}/residents/${id}/deactivate`, {
			inactiveType,
			inactiveNote,
		});
	}

	/**
	 * Activate resident (change status from INATIVO to ATIVO)
	 * POST /v1/admins/residents/:id/activate
	 */
	async activateResident(id: string): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		status: string;
	}>> {
		return apiClient.post<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>(`${this.basePath}/residents/${id}/activate`, {});
	}

	/**
	 * Get resident by ID with all details
	 * GET /v1/admins/residents/:id
	 */
	async getResidentById(id: string): Promise<ApiResponse<{
		_id: string;
		name: string;
		email: string;
		phone: string;
		buildingId: string;
		apartmentId: string;
		status: string;
		photoUrl: string | null;
		residentCode: string;
		createdAt: string;
		updatedAt: string;
		apartment: {
			_id: string;
			number: string;
			block: string;
			floor: number;
			status: string;
		} | null;
	}>> {
		return apiClient.get<{
			_id: string;
			name: string;
			email: string;
			phone: string;
			buildingId: string;
			apartmentId: string;
			status: string;
			photoUrl: string | null;
			residentCode: string;
			createdAt: string;
			updatedAt: string;
			apartment: {
				_id: string;
				number: string;
				block: string;
				floor: number;
				status: string;
			} | null;
		}>(`${this.basePath}/residents/${id}`);
	}

	// TODO: Add more admin endpoints as needed:
	// - Financial management
	// - Fines management
	// - Polls management
	// - Voting management
	// - Condominium info management
}

// Export singleton instance
export const adminService = new AdminService();
