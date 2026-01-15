/**
 * Payments API Service
 * Handles all payment-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Payment data
 */
export interface Payment {
	_id: string;
	paymentOriginId: string;
	entityOriginId: string;
	paymentUrl: string;
	platformFee: number;
	method: "PIX" | "BOLETO" | "CARD";
	type: "BOOKING";
	gateway: string;
	value: number;
	residentId: string;
	apartmentId: string;
	buildingId: string;
	status: "PENDENTE" | "PAGO" | "CANCELADO" | "ERROR";
	error?: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
}

/**
 * Payments Service Class
 */
class PaymentsService {
	private readonly basePath = `/${API_CONFIG.version}/payments`;

	/**
	 * Get payment by ID
	 * GET /v1/payments/:id
	 */
	async getPaymentById(id: string): Promise<ApiResponse<Payment>> {
		return apiClient.get<Payment>(`${this.basePath}/${id}`);
	}

	/**
	 * Get payment by entityOriginId (booking ID)
	 * GET /v1/payments/entity/:entityOriginId
	 */
	async getPaymentByEntityOriginId(
		entityOriginId: string,
	): Promise<ApiResponse<Payment>> {
		return apiClient.get<Payment>(`${this.basePath}/entity/${entityOriginId}`);
	}

	/**
	 * Get payment by paymentOriginId
	 * GET /v1/payments/origin/:paymentOriginId
	 */
	async getPaymentByPaymentOriginId(
		paymentOriginId: string,
	): Promise<ApiResponse<Payment>> {
		return apiClient.get<Payment>(
			`${this.basePath}/origin/${paymentOriginId}`,
		);
	}
}

export const paymentsService = new PaymentsService();

