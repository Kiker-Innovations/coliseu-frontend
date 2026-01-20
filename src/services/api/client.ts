/**
 * API Client
 * Base HTTP client with interceptors, error handling, retry mechanism and caching
 * Prepared for JWT authentication
 */

import { API_CONFIG, AUTH_STORAGE_KEYS } from "@/config/api.config";
import type { ApiResponse, ApiError, RequestConfig } from "./types";
import { cacheService } from "@/services/network/cacheService";
import { NETWORK_MESSAGES } from "@/services/network/networkMessages";

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
	maxAttempts: 3,
	baseDelay: 1000, // 1 second
	retryableErrors: ["NETWORK_ERROR", "TIMEOUT"],
} as const;

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
 * Custom error class for network errors
 */
export class NetworkError extends Error {
	public isNetworkError = true;
	public isTimeout = false;
	public isOffline = false;

	constructor(message: string, options?: { isTimeout?: boolean; isOffline?: boolean }) {
		super(message);
		this.name = "NetworkError";
		this.isTimeout = options?.isTimeout ?? false;
		this.isOffline = options?.isOffline ?? false;
	}

	/**
	 * Get user-friendly message
	 */
	getUserMessage(): string {
		if (this.isOffline) {
			return NETWORK_MESSAGES.OFFLINE;
		}
		if (this.isTimeout) {
			return NETWORK_MESSAGES.TIMEOUT;
		}
		return NETWORK_MESSAGES.TEMPORARY_FAILURE;
	}
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
	return RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Check if we should retry the request
 * Only retries GET requests to avoid side effects
 */
function shouldRetry(error: unknown, attempt: number, allowRetry: boolean): boolean {
	// Don't retry if retry is not allowed (POST, PUT, PATCH, DELETE)
	if (!allowRetry) {
		return false;
	}

	// Don't retry if we've exceeded max attempts
	if (attempt >= RETRY_CONFIG.maxAttempts) {
		return false;
	}

	// Don't retry if user is offline
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return false;
	}

	// Retry on network errors
	if (error instanceof NetworkError) {
		return true;
	}

	// Don't retry on API errors (4xx, 5xx with response)
	if (error instanceof ApiClientError) {
		return false;
	}

	return false;
}

/**
 * API Client Class
 * Handles all HTTP requests with automatic token injection, error handling, retry and caching
 */
class ApiClient {
	private baseURL: string;
	private timeout: number;
	private token: string | null = null;

	constructor() {
		this.baseURL = API_CONFIG.baseURL;
		this.timeout = API_CONFIG.timeout;

		// Initialize token from storage on construction
		this.initializeTokenFromStorage();
	}

	/**
	 * Initialize token from storage
	 */
	private initializeTokenFromStorage(): void {
		const token = this.getAuthToken();
		if (token) {
			this.setAuthToken(token);
		}
	}

	/**
	 * Get authentication token from storage
	 */
	private getAuthToken(): string | null {
		const token =
			this.token ||
			localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
			sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
			null;

		if (token && !this.token) {
			this.token = token;
		}

		return token;
	}

	/**
	 * Build complete URL with query parameters
	 */
	private buildURL(
		endpoint: string,
		params?: Record<string, string | number | boolean | string[] | number[]>,
	): string {
		if (endpoint.includes("?")) {
			return `${this.baseURL}${endpoint}`;
		}

		const url = new URL(`${this.baseURL}${endpoint}`);

		if (params && Object.keys(params).length > 0) {
			for (const [key, value] of Object.entries(params)) {
				if (Array.isArray(value)) {
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

		if (!headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}

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

		try {
			if (isJSON) {
				data = await response.json();
			} else {
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
	 * Retry is only allowed for GET requests to avoid side effects
	 */
	private async executeRequest<T>(
		url: string,
		config: RequestConfig,
		options: { allowRetry: boolean } = { allowRetry: false },
		attempt: number = 1,
	): Promise<ApiResponse<T>> {
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

			// If it's already an ApiClientError, don't wrap it
			if (error instanceof ApiClientError) {
				throw error;
			}

			// Convert to NetworkError
			let networkError: NetworkError;

			if (error instanceof Error) {
				if (error.name === "AbortError") {
					networkError = new NetworkError(NETWORK_MESSAGES.TIMEOUT, { isTimeout: true });
				} else if (!navigator.onLine) {
					networkError = new NetworkError(NETWORK_MESSAGES.OFFLINE, { isOffline: true });
				} else {
					networkError = new NetworkError(NETWORK_MESSAGES.TEMPORARY_FAILURE);
				}
			} else {
				networkError = new NetworkError(NETWORK_MESSAGES.GENERIC_ERROR);
			}

			// Check if we should retry (only for GET requests)
			if (shouldRetry(networkError, attempt, options.allowRetry)) {
				const delay = getBackoffDelay(attempt);
				console.log(`Retrying request (attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts}) after ${delay}ms...`);
				await sleep(delay);
				return this.executeRequest<T>(url, config, options, attempt + 1);
			}

			throw networkError;
		}
	}

	/**
	 * Generic request method
	 * Only GET requests are allowed to retry automatically
	 */
	private async request<T>(
		endpoint: string,
		config: RequestConfig = {},
		options: { allowRetry: boolean } = { allowRetry: false },
	): Promise<ApiResponse<T>> {
		const { params, headers: customHeaders, ...fetchConfig } = config;
		const url = this.buildURL(endpoint, params);
		const headers = this.buildHeaders(customHeaders);

		return this.executeRequest<T>(
			url,
			{
				...fetchConfig,
				headers,
			},
			options,
		);
	}

	/**
	 * GET request with optional caching and automatic retry
	 *
	 * @param endpoint - API endpoint
	 * @param config - Request configuration
	 * @param cacheOptions - Cache options (set to false to disable cache for this request)
	 */
	async get<T>(
		endpoint: string,
		config?: RequestConfig,
		cacheOptions?: { enabled?: boolean; ttl?: number } | false,
	): Promise<ApiResponse<T>> {
		// Determine if caching is enabled
		const cacheEnabled = cacheOptions !== false && cacheOptions?.enabled !== false;
		const cacheTtl = typeof cacheOptions === "object" ? cacheOptions.ttl : undefined;

		// Try to get from cache first (only if online check fails or as fallback)
		const cachedData = cacheEnabled
			? cacheService.get<ApiResponse<T>>(endpoint, config?.params as Record<string, unknown>)
			: null;

		try {
			// Always try to fetch fresh data when online
			// GET requests are allowed to retry automatically
			const response = await this.request<T>(
				endpoint,
				{
					...config,
					method: "GET",
				},
				{ allowRetry: true },
			);

			// Update cache with fresh data
			if (cacheEnabled && response.success) {
				cacheService.set(endpoint, response, config?.params as Record<string, unknown>, cacheTtl);
			}

			return response;
		} catch (error) {
			// If we have cached data and it's a network error, return cached data
			if (cachedData && error instanceof NetworkError) {
				return cachedData;
			}

			// Otherwise, re-throw the error
			throw error;
		}
	}

	/**
	 * POST request
	 */
	async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
		const token = this.getAuthToken();
		if (!token) {
			console.error("No authentication token found for POST request to:", endpoint);
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
	 */
	setAuthToken(token: string): void {
		localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
		sessionStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
	}

	/**
	 * Clear authentication token
	 */
	clearAuthToken(): void {
		this.token = null;
		localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
		sessionStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);

		// Also clear API cache when logging out
		cacheService.clear();
	}

	/**
	 * Clear all API cache
	 * Useful for testing or forcing fresh data
	 */
	clearCache(): void {
		cacheService.clear();
	}

	/**
	 * Clear cache for specific endpoint
	 * Useful for clearing cache after mutations
	 */
	clearCacheByEndpoint(endpoint: string): void {
		cacheService.clearByPrefix(endpoint);
	}
}

// Export singleton instance
export const apiClient = new ApiClient();
