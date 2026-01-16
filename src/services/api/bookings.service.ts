/**
 * Bookings API Service
 * Handles all booking-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Booking data
 */
export interface Booking {
	_id: string;
	amenityId: string;
	residentId?: string;
	buildingId?: string;
	apartmentId?: string;
	paymentUrl?: string | null; // URL de pagamento associada à reserva
	paymentId?: string | null; // ID do pagamento associado
    startDate: string; // ISO 8601 format
	endDate: string; // ISO 8601 format
	numberOfDays?: number;
	totalValue: number;
	status: "PENDENTE" | "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
	observation?: string;
	createdAt?: string;
	updatedAt?: string;
	paymentStatus?: "PENDENTE" | "PAGO" | "CANCELADO" | "ERROR" | null; // Status do pagamento
}

/**
 * Create booking request
 */
export interface CreateBookingRequest {
	observation?: string;
	amenityId: string;
	startDate: string; // ISO 8601 format (e.g., "2024-01-15T14:00:00Z")
	endDate: string; // ISO 8601 format (e.g., "2024-01-15T16:00:00Z") - required for DIARIO
}

/**
 * Get bookings params
 */
export interface GetBookingsParams {
	page?: number;
	limit?: number;
	amenityId?: string;
	status?: "PENDENTE" | "AGENDADO" | "CANCELADO";
	startDate?: string; // ISO 8601 format
	endDate?: string; // ISO 8601 format
}

/**
 * Bookings List Response
 */
export interface BookingsListResponse {
	bookings: Booking[];
	total: number;
	page: number;
	limit: number;
}

/**
 * Bookings Service Class
 */
class BookingsService {
	private readonly basePath = `/${API_CONFIG.version}/bookings`;

	/**
	 * Create a new booking
	 * POST /v1/bookings
	 */
	async createBooking(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
		return apiClient.post<Booking>(this.basePath, data);
	}

	/**
	 * Get bookings with filters
	 * GET /v1/bookings?page=1&limit=10&amenityId=&status=&startDate=&endDate=
	 */
	async getBookings(
		params?: GetBookingsParams,
	): Promise<ApiResponse<BookingsListResponse>> {
		// Convert params to Record format for apiClient
		const queryParams: Record<string, string | number | boolean | string[] | number[]> = {};
		if (params?.page !== undefined) queryParams.page = params.page;
		if (params?.limit !== undefined) queryParams.limit = params.limit;
		if (params?.amenityId) queryParams.amenityId = params.amenityId;
		if (params?.status) queryParams.status = params.status;
		if (params?.startDate) queryParams.startDate = params.startDate;
		if (params?.endDate) queryParams.endDate = params.endDate;
		
		return apiClient.get<BookingsListResponse>(this.basePath, { params: queryParams });
	}

	/**
	 * Get booking by ID
	 * GET /v1/bookings/:id
	 */
	async getBookingById(id: string): Promise<ApiResponse<Booking>> {
		return apiClient.get<Booking>(`${this.basePath}/${id}`);
	}

	/**
	 * Cancel booking
	 * POST /v1/bookings/:id/cancel
	 */
	async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
		return apiClient.post<Booking>(`${this.basePath}/${id}/cancel`, {});
	}

	/**
	 * Get bookings by building (Admin only)
	 * GET /v1/bookings/admin/building
	 * Returns all bookings for the building, excluding FINALIZADO and CANCELADO
	 */
	async getBookingsByBuilding(): Promise<
		ApiResponse<{
			bookings: Booking[];
			total: number;
		}>
	> {
		return apiClient.get<{
			bookings: Booking[];
			total: number;
		}>(`${this.basePath}/admin/building`);
	}
}

export const bookingsService = new BookingsService();

