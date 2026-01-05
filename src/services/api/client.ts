/**
 * API Client
 * Base HTTP client with interceptors and error handling
 * Prepared for JWT authentication
 */

import { API_CONFIG, AUTH_STORAGE_KEYS } from "@/config/api.config";
import type { ApiResponse, ApiError, RequestConfig } from "./types";

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
	constructor(
		public statusCode: number,
		public response: ApiError,
	) {
		super(response.message);
		this.name = "ApiClientError";
	}
}

/**
 * API Client Class
 * Handles all HTTP requests with automatic token injection and error handling
 */
class ApiClient {
	private baseURL: string;
	private timeout: number;
	private token: string | null = null;

	constructor() {
		this.baseURL = API_CONFIG.baseURL;
		this.timeout = API_CONFIG.timeout;
		
		// Initialize token from storage on construction
		// This ensures the token is available even if setAuthToken wasn't called
		this.initializeTokenFromStorage();
	}
	
	/**
	 * Initialize token from storage
	 * Ensures token is available even if setAuthToken wasn't called explicitly
	 */
	private initializeTokenFromStorage(): void {
		const token = this.getAuthToken();
		if (token) {
			// Token already exists in storage, ensure it's in both places
			this.setAuthToken(token);
		}
	}

	/**
	 * Get authentication token from storage
	 * Checks both localStorage and sessionStorage based on user's "remember me" preference
	 */
	private getAuthToken(): string | null {
		// Try multiple sources to ensure we get the token
		const token = 
			this.token || // First check in-memory token
			localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
			sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
			null;
		
		// If token found but not in memory, update it
		if (token && !this.token) {
			this.token = token;
		}
		
		return token;
	}

	/**
	 * Build complete URL with query parameters
	 * Supports arrays for multiple values with the same key (e.g., status=ATIVO&status=PROGRAMADO)
	 */
	private buildURL(endpoint: string, params?: Record<string, string | number | boolean | string[] | number[]>): string {
		// Se o endpoint já tem query string, não processar params e retornar direto
		if (endpoint.includes("?")) {
			return `${this.baseURL}${endpoint}`;
		}

		const url = new URL(`${this.baseURL}${endpoint}`);

		if (params && Object.keys(params).length > 0) {
			for (const [key, value] of Object.entries(params)) {
				if (Array.isArray(value)) {
					// For arrays, append each value as a separate parameter
					for (const item of value) {
						url.searchParams.append(key, String(item));
					}
				} else if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			}
		}

		return url.toString();
	}

	/**
	 * Build request headers with authentication
	 */
	private buildHeaders(customHeaders?: HeadersInit): Headers {
		const headers = new Headers(customHeaders);

		// Set Content-Type if not already set
		if (!headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}

		// Always refresh token from storage before building headers
		// This ensures we have the latest token
		const token = this.getAuthToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		} else {
			console.warn("No authentication token found. Request may fail if authentication is required.");
		}

		return headers;
	}

	/**
	 * Handle API response
	 */
	private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
		const contentType = response.headers.get("content-type");
		const isJSON = contentType?.includes("application/json");

		let data: ApiResponse<T> | ApiError;

		try {
			if (isJSON) {
				data = await response.json();
			} else {
				// Handle non-JSON responses
				const text = await response.text();
				data = {
					success: response.ok,
					message: text || response.statusText,
				};
			}
		} catch (parseError) {
			console.error("Error parsing response:", parseError);
			const text = await response.text().catch(() => "Erro ao processar resposta");
			data = {
				success: false,
				message: text || response.statusText || "Erro desconhecido",
			} as ApiError;
		}

		if (!response.ok) {
			// Log error details for debugging
			console.error("API Error Response:", {
				status: response.status,
				statusText: response.statusText,
				data,
				url: response.url,
			});
			throw new ApiClientError(response.status, data as ApiError);
		}

		return data as ApiResponse<T>;
	}

	/**
	 * Execute HTTP request with timeout
	 */
	private async executeRequest<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

		// Log request details for debugging
		const token = this.getAuthToken();

		try {
			const response = await fetch(url, {
				...config,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			return await this.handleResponse<T>(response);
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof ApiClientError) {
				throw error;
			}

			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new Error("Request timeout");
				}
				throw new Error(`Network error: ${error.message}`);
			}

			throw new Error("Unknown error occurred");
		}
	}

	/**
	 * Generic request method
	 */
	private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
		const { params, headers: customHeaders, ...fetchConfig } = config;
		const url = this.buildURL(endpoint, params);
		const headers = this.buildHeaders(customHeaders);

		// Log headers for debugging (without exposing full token)
		const authHeader = headers.get("Authorization");

		return this.executeRequest<T>(url, {
			...fetchConfig,
			headers,
		});
	}

	/**
	 * GET request
	 */
	async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			...config,
			method: "GET",
		});
	}

	/**
	 * POST request
	 */
	async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
		// Ensure token is synchronized before making request
		const token = this.getAuthToken();
		if (!token) {
			console.error("No authentication token found for POST request to:", endpoint);
			console.error("localStorage token:", localStorage.getItem(AUTH_STORAGE_KEYS.accessToken));
			console.error("sessionStorage token:", sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken));
		}
		return this.request<T>(endpoint, {
			...config,
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	/**
	 * POST request with FormData (for file uploads)
	 */
	async postFormData<T>(
		endpoint: string,
		formData: FormData,
		config?: RequestConfig,
	): Promise<ApiResponse<T>> {
		// Remove Content-Type header to let browser set it with boundary
		const headers = new Headers(config?.headers);
		headers.delete("Content-Type");

		const token = this.getAuthToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}

		return this.request<T>(endpoint, {
			...config,
			method: "POST",
			headers,
			body: formData,
		});
	}

	/**
	 * PUT request
	 */
	async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			...config,
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	/**
	 * PATCH request
	 */
	async patch<T>(
		endpoint: string,
		data?: unknown,
		config?: RequestConfig,
	): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			...config,
			method: "PATCH",
			body: JSON.stringify(data),
		});
	}

	/**
	 * DELETE request
	 */
	async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			...config,
			method: "DELETE",
		});
	}

	/**
	 * Set authentication token
	 * For future JWT implementation
	 * Saves to both localStorage and sessionStorage to ensure it's available
	 */
	setAuthToken(token: string): void {
		localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
		sessionStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
	}

	/**
	 * Clear authentication token
	 */
	clearAuthToken(): void {
		// Clear in-memory token
		this.token = null;
		
		// Clear from both storages for consistency
		localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
	}
}

// Export singleton instance
export const apiClient = new ApiClient();
