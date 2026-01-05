/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
	baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/coliseu",
	timeout: 30000, // 30 seconds
	version: "v1",
} as const;

/**
 * Storage keys for authentication tokens
 * Prepared for future JWT implementation
 */
export const AUTH_STORAGE_KEYS = {
	accessToken: "coliseu_access_token",
	refreshToken: "coliseu_refresh_token",
	user: "coliseu_user",
} as const;
