/**
 * Infractions API Service
 * Handles all infraction-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Infraction data
 */
export interface Infraction {
	_id: string;
	apartmentId: string;
	fineId: string;
	type: "MULTA" | "NOTIFICACAO";
	description: string;
	value: number;
	occurrenceDate: string;
	status: "PENDENTE" | "EM_REVISAO" | "PAGO" | "CANCELADA" | "ATIVO" | "INATIVO";
	canceledNote?: string;
	createdAt: string;
	updatedAt?: string;
	contextedAt?: string;
	confirmedAt?: string;
	paidAt?: string;
	canceledAt?: string;
	residents?: Array<{
		_id: string;
		name: string;
		email: string;
		phone?: string;
	}>;
}

/**
 * Apartment with infractions and residents (from GET /v1/infractions)
 */
export interface ApartmentWithInfractions {
	_id: string;
	buildingId: string;
	number: string;
	block: string;
	floor: number;
	status: string;
	createdAt: string;
	updatedAt: string;
	residents: Array<{
		_id: string;
		name: string;
		email: string;
		phone?: string;
	}>;
	infractions: Array<{
		_id: string;
		apartmentId: string;
		fineId: string;
		type: "MULTA" | "NOTIFICACAO";
		description: string;
		value: number;
		occurrenceDate: string;
		status: "PENDENTE" | "EM_REVISAO" | "PAGO" | "CANCELADA" | "ATIVO" | "INATIVO";
		createdAt: string;
		updatedAt: string;
		contextedAt?: string;
		confirmedAt?: string;
		paidAt?: string;
		canceledAt?: string;
		canceledNote?: string;
	}>;
}

/**
 * Create Fine Infraction Request
 */
export interface CreateFineInfractionRequest {
	fineId: string;
	apartmentId: string;
	value: number;
	occurrenceDate: string;
}

/**
 * Create Notification Infraction Request
 */
export interface CreateNotificationInfractionRequest {
	fineId: string;
	apartmentId: string;
	description: string;
	occurrenceDate: string;
}

/**
 * Get Infractions Params
 */
export interface GetInfractionsParams {
	apartmentId?: string;
	status?: "PENDENTE" | "EM_REVISAO" | "PAGO" | "CANCELADA";
}

/**
 * Fine data (from my-fines endpoint)
 */
export interface Fine {
	_id: string;
	apartmentId: string;
	fineId: string;
	type: "MULTA";
	description: string;
	value: number;
	occurrenceDate: string;
	status: "PENDENTE" | "EM_REVISAO" | "PAGO" | "CANCELADA";
	createdAt: string;
	updatedAt: string;
	contextedAt?: string;
	confirmedAt?: string;
	paidAt?: string;
	canceledAt?: string;
	canceledNote?: string;
	fineName?: string;
	fineDescription?: string;
}

/**
 * Infractions Service Class
 */
class InfractionsService {
	private readonly basePath = `/${API_CONFIG.version}/infractions`;

	/**
	 * Get all infractions (returns apartments with infractions and residents)
	 * GET /v1/infractions
	 */
	async getInfractions(params?: GetInfractionsParams): Promise<ApartmentWithInfractions[]> {
		// Map params to plain object to satisfy axios/ts expectations
		const cleanParams: Record<string, string> = {};
		if (params) {
			if (params.apartmentId !== undefined) cleanParams.apartmentId = params.apartmentId;
			if (params.status !== undefined) cleanParams.status = params.status;
		}
		const response = await apiClient.get<ApartmentWithInfractions[]>(this.basePath, {
			params: cleanParams,
		});
		return Array.isArray(response.data) ? response.data : [];
	}

	/**
	 * Create fine infraction
	 * POST /v1/infractions/fine
	 */
	async createFineInfraction(data: CreateFineInfractionRequest): Promise<Infraction> {
		const response = await apiClient.post<Infraction>(`${this.basePath}/fine`, data);
		return response.data!;
	}

	/**
	 * Create notification infraction
	 * POST /v1/infractions/notification
	 */
	async createNotificationInfraction(
		data: CreateNotificationInfractionRequest,
	): Promise<Infraction> {
		const response = await apiClient.post<Infraction>(`${this.basePath}/notification`, data);
		return response.data!;
	}

	/**
	 * Get my fines (resident only)
	 * GET /v1/infractions/my-fines
	 */
	async getMyFines(status?: "PENDENTE" | "EM_REVISAO" | "PAGO" | "CANCELADA"): Promise<Fine[]> {
		const cleanParams: Record<string, string> = {};
		if (status) {
			cleanParams.status = status;
		}

		const response = await apiClient.get<Fine[]>(`${this.basePath}/my-fines`, {
			params: cleanParams,
		});
		// A resposta da API vem com estrutura { success, message, data }
		// onde data é um array de multas
		return Array.isArray(response.data) ? response.data : [];
	}

	/**
	 * Contest infraction (resident only)
	 * POST /v1/infractions/contest
	 */
	async contestInfraction(
		infractionId: string,
		text: string,
		fileName: string,
		fileSize: number,
		mimeType: string,
	): Promise<{
		_id: string;
		infractionId: string;
		presignedUrl: string;
		createdAt: string;
	}> {
		const response = await apiClient.post<{
			_id: string;
			infractionId: string;
			presignedUrl: string;
			createdAt: string;
		}>(`${this.basePath}/contest`, {
			infractionId,
			text,
			fileName,
			fileSize,
			mimeType,
		});
		return response.data!;
	}

	/**
	 * Get infraction appeal (resident only)
	 * GET /v1/infractions/:infractionId/appeal
	 */
	async getInfractionAppeal(infractionId: string): Promise<{
		_id: string;
		infractionId: string;
		text: string;
		fileName: string;
		fileSize: number;
		url: string;
		createdAt: string;
	}> {
		const response = await apiClient.get<{
			_id: string;
			infractionId: string;
			text: string;
			fileName: string;
			fileSize: number;
			url: string;
			createdAt: string;
		}>(`${this.basePath}/${infractionId}/appeal`);
		return response.data!;
	}

	/**
	 * Approve infraction appeal (admin only)
	 * POST /v1/infractions/:infractionId/appeal/approve
	 */
	async approveAppeal(infractionId: string): Promise<{
		_id: string;
		status: string;
		canceledAt: string;
	}> {
		const response = await apiClient.post<{
			_id: string;
			status: string;
			canceledAt: string;
		}>(`${this.basePath}/${infractionId}/appeal/approve`, {});
		return response.data!;
	}

	/**
	 * Reject infraction appeal (admin only)
	 * POST /v1/infractions/:infractionId/appeal/reject
	 */
	async rejectAppeal(infractionId: string): Promise<{
		_id: string;
		status: string;
		confirmedAt: string;
	}> {
		const response = await apiClient.post<{
			_id: string;
			status: string;
			confirmedAt: string;
		}>(`${this.basePath}/${infractionId}/appeal/reject`, {});
		return response.data!;
	}

	/**
	 * Get infraction appeal for admin (admin only)
	 * GET /v1/infractions/:infractionId/appeal/admin
	 */
	async getInfractionAppealForAdmin(infractionId: string): Promise<{
		_id: string;
		infractionId: string;
		text: string;
		fileName: string;
		fileSize: number;
		url: string;
		createdAt: string;
		residentId: string;
	}> {
		const response = await apiClient.get<{
			_id: string;
			infractionId: string;
			text: string;
			fileName: string;
			fileSize: number;
			url: string;
			createdAt: string;
			residentId: string;
		}>(`${this.basePath}/${infractionId}/appeal/admin`);
		return response.data!;
	}
}

// Export singleton instance
export const infractionsService = new InfractionsService();
