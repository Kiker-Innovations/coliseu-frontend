/**
 * Common API Types
 * Standard response format and shared interfaces
 */

/**
 * Standard API Response format from backend
 * All endpoints return this structure
 */
export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
}

/**
 * API Error response
 */
export interface ApiError {
	success: false;
	message: string;
	data?: {
		errors?: Record<string, string[]>;
		code?: string;
	};
}

/**
 * Request configuration options
 */
export interface RequestConfig extends RequestInit {
	params?: Record<string, string | number | boolean>;
	timeout?: number;
}

/**
 * HTTP Methods
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
