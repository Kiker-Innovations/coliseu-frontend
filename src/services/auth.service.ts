/**
 * Authentication Service
 * Handles authentication for all three user types: resident, concierge, and admin
 */

import { apiClient } from "./api/client";
import type { ApiResponse } from "./api/types";

// User Types
export type UserType = "resident" | "concierge" | "admin";

// Auth Response Types
export interface ResidentUser {
	email: string;
	name: string;
	buildingName: string;
	apartmentNumber: string;
	blockName: string;
}

export interface ConciergeUser {
	email: string;
	name: string;
	buildingName: string;
	shift: string;
}

export interface AdminUser {
	email: string;
	name: string;
	buildingName: string;
}

export type User = ResidentUser | ConciergeUser | AdminUser;

export interface AuthTokens {
	token: string;
	refreshToken: string;
}

export interface LoginResponse {
	token: string;
	refreshToken: string;
	user: User;
}

export interface ValidateResponse {
	email: string;
	name: string;
	buildingName: string;
	apartmentNumber?: string;
	blockName?: string;
	shift?: string;
}

export interface RefreshResponse {
	token: string;
	refreshToken: string;
}

// Login Credentials
export interface ResidentLoginCredentials {
	buildingId: string;
	email: string;
	password: string;
}

export interface ConciergeLoginCredentials {
	buildingId: string;
	email: string;
	password: string;
}

export interface AdminLoginCredentials {
	buildingId: string;
	email: string;
	password: string;
}

// Storage Keys
const STORAGE_KEYS = {
	TOKEN: "coliseu_access_token",
	REFRESH_TOKEN: "coliseu_refresh_token",
	USER: "coliseu_user",
	USER_TYPE: "coliseu_user_type",
	REMEMBER_ME: "coliseu_remember_me",
} as const;

class AuthService {
	/**
	 * Get storage based on remember me preference
	 */
	private getStorage(): Storage {
		const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
		return rememberMe ? localStorage : sessionStorage;
	}

	/**
	 * Set remember me preference
	 */
	private setRememberMe(remember: boolean): void {
		if (remember) {
			localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
		} else {
			localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
		}
	}

	/**
	 * Save authentication data to storage
	 */
	private saveAuthData(
		tokens: AuthTokens,
		user: User,
		userType: UserType,
		rememberMe: boolean,
	): void {
		this.setRememberMe(rememberMe);
		const storage = this.getStorage();

		storage.setItem(STORAGE_KEYS.TOKEN, tokens.token);
		storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
		storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
		storage.setItem(STORAGE_KEYS.USER_TYPE, userType);

		// Also save token to apiClient for automatic header injection
		// This ensures the token is available in both localStorage and sessionStorage
		apiClient.setAuthToken(tokens.token);
	}

	/**
	 * Get current auth token
	 */
	getToken(): string | null {
		const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
		// Ensure token is also set in apiClient if it exists
		if (token) {
			apiClient.setAuthToken(token);
		}
		return token;
	}

	/**
	 * Get refresh token
	 */
	getRefreshToken(): string | null {
		return (
			localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
			sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
		);
	}

	/**
	 * Get current user
	 */
	getCurrentUser(): User | null {
		const storage = this.getStorage();
		const userStr = storage.getItem(STORAGE_KEYS.USER);
		if (!userStr) return null;

		try {
			return JSON.parse(userStr);
		} catch {
			return null;
		}
	}

	/**
	 * Get current user type
	 */
	getUserType(): UserType | null {
		return (
			(localStorage.getItem(STORAGE_KEYS.USER_TYPE) as UserType) ||
			(sessionStorage.getItem(STORAGE_KEYS.USER_TYPE) as UserType) ||
			null
		);
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return !!this.getToken() && !!this.getCurrentUser();
	}

	/**
	 * Clear all authentication data
	 */
	clearAuth(): void {
		// Clear from both storages
		for (const storage of [localStorage, sessionStorage]) {
			storage.removeItem(STORAGE_KEYS.TOKEN);
			storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
			storage.removeItem(STORAGE_KEYS.USER);
			storage.removeItem(STORAGE_KEYS.USER_TYPE);
		}
		localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

		// Clear token from apiClient
		apiClient.clearAuthToken();
	}

	/**
	 * Login as Resident
	 */
	async loginResident(
		credentials: ResidentLoginCredentials,
		rememberMe = false,
	): Promise<LoginResponse> {
		const response = await apiClient.post<LoginResponse>("/v1/auth/login/resident", credentials);

		if (response.success && response.data) {
			this.saveAuthData(
				{
					token: response.data.token,
					refreshToken: response.data.refreshToken,
				},
				response.data.user,
				"resident",
				rememberMe,
			);
		}

		return response.data!;
	}

	/**
	 * Login as Concierge
	 */
	async loginConcierge(
		credentials: ConciergeLoginCredentials,
		rememberMe = false,
	): Promise<LoginResponse> {
		const response = await apiClient.post<{ token: string; refreshToken: string }>("/v1/auth/login/concierge", credentials);

		if (response.success && response.data) {
			// Save tokens first
			this.setRememberMe(rememberMe);
			const storage = this.getStorage();
			storage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
			storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
			storage.setItem(STORAGE_KEYS.USER_TYPE, "concierge");
			// Also save with concierge_token key for compatibility
			localStorage.setItem("concierge_token", response.data.token);
			localStorage.setItem("concierge_refresh_token", response.data.refreshToken);
			apiClient.setAuthToken(response.data.token);

			// Fetch concierge profile to build user object
			try {
				const conciergeResponse = await apiClient.get<{ _id: string; name: string; email: string; shift: string; buildingId?: string; building?: { name: string } }>("/v1/concierges/me");
				if (conciergeResponse.success && conciergeResponse.data) {
					const conciergeData = conciergeResponse.data;
					const user: ConciergeUser = {
						email: conciergeData.email,
						name: conciergeData.name,
						buildingName: conciergeData.building?.name || "",
						shift: conciergeData.shift || "",
					};
					storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
					
					// Also save concierge ID and name to localStorage for compatibility
					if (conciergeData._id) {
						localStorage.setItem("concierge_id", String(conciergeData._id));
					}
					if (conciergeData.name) {
						localStorage.setItem("concierge_name", conciergeData.name);
					}
					
					return {
						token: response.data.token,
						refreshToken: response.data.refreshToken,
						user,
					};
				}
			} catch (error) {
				console.error("Failed to fetch concierge profile:", error);
				// If validation fails, create a minimal user object
				const user: ConciergeUser = {
					email: credentials.email,
					name: "",
					buildingName: "",
					shift: "",
				};
				storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
				
				return {
					token: response.data.token,
					refreshToken: response.data.refreshToken,
					user,
				};
			}
		}

		throw new Error("Login failed");
	}

	/**
	 * Login as Admin
	 */
	async loginAdmin(credentials: AdminLoginCredentials, rememberMe = false): Promise<LoginResponse> {
		const response = await apiClient.post<LoginResponse>("/v1/auth/login/admin", credentials);

		if (response.success && response.data) {
			this.saveAuthData(
				{
					token: response.data.token,
					refreshToken: response.data.refreshToken,
				},
				response.data.user,
				"admin",
				rememberMe,
			);
		}

		return response.data!;
	}

	/**
	 * Validate current session for Resident
	 */
	async validateResident(): Promise<ResidentUser> {
		const response = await apiClient.get<ValidateResponse>("/v1/auth/validate/resident");
		if (response.success && response.data) {
			return response.data as ResidentUser;
		}
		throw new Error("Failed to validate resident session");
	}

	/**
	 * Validate current session for Concierge
	 */
	async validateConcierge(): Promise<ConciergeUser> {
		const response = await apiClient.get<ValidateResponse>("/v1/auth/validate/concierge");
		if (response.success && response.data) {
			return response.data as ConciergeUser;
		}
		throw new Error("Failed to validate concierge session");
	}

	/**
	 * Validate current session for Admin
	 */
	async validateAdmin(): Promise<AdminUser> {
		const response = await apiClient.get<ValidateResponse>("/v1/auth/validate/admin");
		if (response.success && response.data) {
			return response.data as AdminUser;
		}
		throw new Error("Failed to validate admin session");
	}

	/**
	 * Validate session based on user type
	 */
	async validateSession(): Promise<User | null> {
		const userType = this.getUserType();
		if (!userType || !this.getToken()) {
			return null;
		}

		try {
			let user: User;

			switch (userType) {
				case "resident":
					user = await this.validateResident();
					break;
				case "concierge":
					user = await this.validateConcierge();
					break;
				case "admin":
					user = await this.validateAdmin();
					break;
				default:
					return null;
			}

			// Update user data in storage
			const storage = this.getStorage();
			storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

			return user;
		} catch (error) {
			// If validation fails, try to refresh token
			return await this.attemptTokenRefresh();
		}
	}

	/**
	 * Refresh authentication token
	 */
	async refreshToken(): Promise<AuthTokens> {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error("No refresh token available");
		}

		const response = await apiClient.post<RefreshResponse>("/v1/auth/refresh", {
			refreshToken,
		});

		if (response.success && response.data) {
			const tokens: AuthTokens = {
				token: response.data.token,
				refreshToken: response.data.refreshToken,
			};

			// Update tokens in storage
			const storage = this.getStorage();
			storage.setItem(STORAGE_KEYS.TOKEN, tokens.token);
			storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);

			// Update token in apiClient
			apiClient.setAuthToken(tokens.token);

			return tokens;
		}

		throw new Error("Failed to refresh token");
	}

	/**
	 * Attempt to refresh token and validate session
	 */
	private async attemptTokenRefresh(): Promise<User | null> {
		try {
			await this.refreshToken();
			// After refreshing, try to validate again
			const userType = this.getUserType();
			if (!userType) return null;

			switch (userType) {
				case "resident":
					return await this.validateResident();
				case "concierge":
					return await this.validateConcierge();
				case "admin":
					return await this.validateAdmin();
				default:
					return null;
			}
		} catch {
			// If refresh fails, clear auth and return null
			this.clearAuth();
			return null;
		}
	}

	/**
	 * Logout
	 */
	async logout(): Promise<void> {
		this.clearAuth();
	}

	/**
	 * Get redirect path based on user type
	 */
	getRedirectPath(userType: UserType): string {
		switch (userType) {
			case "resident":
				return "/dashboard";
			case "concierge":
				return "/concierge/dashboard";
			case "admin":
				return "/admin/dashboard";
		}
	}

	/**
	 * Get login path based on user type
	 */
	getLoginPath(userType: UserType): string {
		switch (userType) {
			case "resident":
				return "/login";
			case "concierge":
				return "/concierge/login";
			case "admin":
				return "/admin/login";
		}
	}
}

// Export singleton instance
export const authService = new AuthService();
