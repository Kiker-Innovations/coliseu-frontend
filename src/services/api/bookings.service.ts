/**
 * Amenity Bookings API Service
 * Handles all amenity booking-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Amenity Booking data
 */
export interface AmenityBooking {
	_id: string;
	amenityId: string;
	residentId?: string;
	buildingId?: string;
	apartmentId?: string;
	startDate: string; // ISO 8601 format
	endDate: string; // ISO 8601 format
	totalValue: number;
	status: "PENDENTE" | "CONFIRMADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
	createdAt?: string;
	updatedAt?: string;
	amenity?: {
		_id: string;
		name: string;
		description?: string | null;
		type?: string | null;
	};
	apartment?: {
		_id: string;
		number: string;
		floor?: number | null;
		block?: string | null;
	};
	resident?: {
		_id: string;
		name: string;
		email: string;
	} | null;
}

/**
 * Create amenity booking request
 */
export interface CreateAmenityBookingRequest {
	amenityId: string;
	startDate: string; // ISO 8601 format (e.g., "2024-01-15T14:00:00Z")
	endDate: string; // ISO 8601 format (e.g., "2024-01-15T16:00:00Z")
	totalValue: number;
}

/**
 * Get amenity bookings params
 */
export interface GetAmenityBookingsParams {
	page?: number;
	limit?: number;
	amenityId?: string;
	status?: "PENDENTE" | "CONFIRMADO" | "CANCELADO";
	startDate?: string; // ISO 8601 format
	endDate?: string; // ISO 8601 format
}

/**
 * Amenity Bookings List Response
 */
export interface AmenityBookingsListResponse {
	bookings: AmenityBooking[];
	total: number;
	page: number;
	limit: number;
}

/**
 * Amenity Bookings Service Class
 */
class AmenityBookingsService {
	private readonly basePath = `/${API_CONFIG.version}/amenity-bookings`;

	/**
	 * Create a new amenity booking
	 * POST /v1/amenity-bookings
	 */
	async createBooking(
		data: CreateAmenityBookingRequest,
	): Promise<ApiResponse<AmenityBooking>> {
		return apiClient.post<AmenityBooking>(this.basePath, data);
	}

	/**
	 * Get amenity bookings with filters
	 * GET /v1/amenity-bookings?page=1&limit=10&amenityId=&status=&startDate=&endDate=
	 */
	async getBookings(
		params?: GetAmenityBookingsParams,
	): Promise<ApiResponse<AmenityBookingsListResponse>> {
		return apiClient.get<AmenityBookingsListResponse>(this.basePath, { params });
	}

	/**
	 * Get booking by ID
	 * GET /v1/amenity-bookings/:id
	 */
	async getBookingById(id: string): Promise<ApiResponse<AmenityBooking>> {
		return apiClient.get<AmenityBooking>(`${this.basePath}/${id}`);
	}

	/**
	 * Cancel amenity booking
	 * POST /v1/amenity-bookings/:id/cancel
	 */
	async cancelBooking(id: string): Promise<ApiResponse<AmenityBooking>> {
		return apiClient.post<AmenityBooking>(`${this.basePath}/${id}/cancel`, {});
	}

	/**
	 * Get amenity bookings by building (Admin only)
	 * GET /v1/amenity-bookings/admin/building
	 * Returns all bookings for the building, excluding FINALIZADO and CANCELADO
	 */
	async getBookingsByBuilding(): Promise<ApiResponse<{
		bookings: AmenityBooking[];
		total: number;
	}>> {
		return apiClient.get<{
			bookings: AmenityBooking[];
			total: number;
		}>(`${this.basePath}/admin/building`);
	}
}

export const amenityBookingsService = new AmenityBookingsService();

// Legacy exports for backward compatibility (deprecated - use amenityBookingsService)
export type Booking = AmenityBooking;
export type CreateBookingRequest = CreateAmenityBookingRequest;
export type GetBookingsParams = GetAmenityBookingsParams;
export type BookingsListResponse = AmenityBookingsListResponse;
export type AvailableTimeSlot = {
	startTime: string;
	endTime: string;
	isAvailable: boolean;
};

/**
 * @deprecated Use amenityBookingsService instead
 */
class BookingsService {
	private readonly basePath = `/${API_CONFIG.version}/bookings`;

	async createBooking(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
		console.warn("bookingsService.createBooking is deprecated. Use amenityBookingsService.createBooking instead.");
		// Convert legacy format to new format
		const newData: CreateAmenityBookingRequest = {
			amenityId: data.amenityId,
			startDate: `${data.date}T${data.startTime}:00Z`,
			endDate: `${data.date}T${data.endTime}:00Z`,
			totalValue: 0, // Legacy doesn't have totalValue
		};
		return amenityBookingsService.createBooking(newData);
	}

	async getBookings(params?: GetBookingsParams): Promise<ApiResponse<BookingsListResponse>> {
		console.warn("bookingsService.getBookings is deprecated. Use amenityBookingsService.getBookings instead.");
		const newParams: GetAmenityBookingsParams = {
			page: params?.page,
			limit: params?.limit,
			amenityId: params?.amenityId,
			status: params?.status,
			startDate: params?.date ? `${params.date}T00:00:00Z` : undefined,
		};
		const response = await amenityBookingsService.getBookings(newParams);
		// Convert response format
		if (response.success && response.data) {
			return {
				...response,
				data: {
					bookings: response.data.data,
					total: response.data.total,
					page: response.data.page,
					limit: response.data.limit,
				},
			};
		}
		return response as any;
	}

	async getBookingById(id: string): Promise<ApiResponse<Booking>> {
		console.warn("bookingsService.getBookingById is deprecated. Use amenityBookingsService.getBookingById instead.");
		return amenityBookingsService.getBookingById(id);
	}

	async getAvailableTimeSlots(
		amenityId: string,
		date: string,
	): Promise<ApiResponse<{ slots: AvailableTimeSlot[] }>> {
		console.warn("bookingsService.getAvailableTimeSlots is deprecated.");
		// This endpoint might not exist in the new API
		return apiClient.get<{ slots: AvailableTimeSlot[] }>(
			`/${API_CONFIG.version}/amenities/${amenityId}/available-slots`,
			{
				params: { date },
			},
		);
	}

	async updateBooking(
		id: string,
		data: any,
	): Promise<ApiResponse<Booking>> {
		console.warn("bookingsService.updateBooking is deprecated.");
		return apiClient.put<Booking>(`${this.basePath}/${id}`, data);
	}

	async confirmBooking(id: string): Promise<ApiResponse<Booking>> {
		console.warn("bookingsService.confirmBooking is deprecated. Use amenityBookingsService.cancelBooking for cancel, confirm might not be available.");
		return apiClient.post<Booking>(`${this.basePath}/${id}/confirm`, {});
	}

	async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
		console.warn("bookingsService.cancelBooking is deprecated. Use amenityBookingsService.cancelBooking instead.");
		return amenityBookingsService.cancelBooking(id);
	}

	async deleteBooking(id: string): Promise<ApiResponse<void>> {
		console.warn("bookingsService.deleteBooking is deprecated.");
		return apiClient.delete<void>(`${this.basePath}/${id}`);
	}
}

export const bookingsService = new BookingsService();
