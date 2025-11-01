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
	private readonly basePath = `/${API_CONFIG.version}/admin`;

	/**
	 * Admin login
	 * POST /v1/admin/login
	 */
	async login(data: AdminLoginRequest): Promise<ApiResponse<AdminLoginResponse>> {
		return apiClient.post<AdminLoginResponse>(`${this.basePath}/login`, data);
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

	// TODO: Add more admin endpoints as needed:
	// - Financial management
	// - Fines management
	// - Polls management
	// - Voting management
	// - Resident management
	// - Condominium info management
}

// Export singleton instance
export const adminService = new AdminService();
