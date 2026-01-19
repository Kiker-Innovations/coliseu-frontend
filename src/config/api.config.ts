/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

const API_ENVIRONMENT = (import.meta.env.VITE_ENVIRONMENT || "local").toLowerCase();

const API_BASE_URLS = {
	local: import.meta.env.VITE_API_URL_LOCAL || "http://localhost:3000/api/coliseu",
	hml: import.meta.env.VITE_API_URL_HML || "https://api-hml.coliseu.app/v1/api/coliseu",
	prd: import.meta.env.VITE_API_URL_PRD || "https://api.coliseu.app/v1/api/coliseu",
} as const;

const getBaseUrl = () => {
	if (API_ENVIRONMENT in API_BASE_URLS) {
		return API_BASE_URLS[API_ENVIRONMENT as keyof typeof API_BASE_URLS];
	}

	return API_BASE_URLS.local;
};

export const API_CONFIG = {
	baseURL: getBaseUrl(),
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
