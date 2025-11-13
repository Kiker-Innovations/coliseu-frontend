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

	constructor() {
		this.baseURL = API_CONFIG.baseURL;
		this.timeout = API_CONFIG.timeout;
	}

	/**
	 * Get authentication token from storage
	 * Will be used for JWT authentication in the future
	 */
	private getAuthToken(): string | null {
		return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
	}

	/**
	 * Build complete URL with query parameters
	 */
	private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
		const url = new URL(`${this.baseURL}${endpoint}`);

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.append(key, String(value));
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

		// Add authentication token if available (for future JWT implementation)
		const token = this.getAuthToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
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

		if (!response.ok) {
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
	 */
	setAuthToken(token: string): void {
		localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
	}

	/**
	 * Clear authentication token
	 */
	clearAuthToken(): void {
		// Clear from both storages for consistency
		localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
	}
}

// Export singleton instance
export const apiClient = new ApiClient();
