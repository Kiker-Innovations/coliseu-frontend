/**
 * Amenities API Service
 * Handles all amenity-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Item da comodidade
 */
export interface AmenityItem {
	name: string;
	quantity: number;
}

/**
 * Amenity data
 */
export interface Amenity {
	_id: string;
	buildingId: string;
	name: string;
	description?: string;
	type?: "COMODIDADE" | "AREA_COMUM";
	value?: number;
	fineValue?: number;
	nonComplianceFine?: number;
	maxResidents?: number;
	maxHours?: number;
	usageRules?: string; // HTML content
	bookingType?: "DIARIO" | "POR_HORAS";
	openingTime?: string; // HH:mm format (e.g., "08:00")
	closingTime?: string; // HH:mm format (e.g., "22:00")
	items?: AmenityItem[]; // Lista de itens da comodidade
	status?: "ATIVO" | "INATIVO";
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Amenities Service Class
 */
class AmenitiesService {
	private readonly basePath = `/${API_CONFIG.version}/amenities`;

	/**
	 * Get amenities by buildingId
	 * GET /v1/amenities?buildingId=...
	 */
	async getAmenitiesByBuildingId(buildingId?: string): Promise<Amenity[]> {
		try {
			// buildingId agora é extraído do token JWT no backend
			const response = await apiClient.get<Amenity[]>(this.basePath);
			// O backend retorna { success, message, data: Amenity[] }
			if (response.success && response.data) {
				const amenities = Array.isArray(response.data) ? response.data : [];
				return amenities;
			}
			return [];
		} catch (error) {
			console.error("Erro ao buscar amenities:", error);
			throw error;
		}
	}

	/**
	 * Get amenity by ID
	 * GET /v1/amenities/:id
	 */
	async getAmenityById(id: string): Promise<Amenity | null> {
		try {
			const response = await apiClient.get<Amenity>(`${this.basePath}/${id}`);
			return response.data || null;
		} catch {
			return null;
		}
	}

	/**
	 * Create a new amenity
	 * POST /v1/amenities
	 */
	async createAmenity(data: {
		buildingId: string;
		name: string;
		description?: string;
		type?: "COMODIDADE" | "AREA_COMUM";
		value?: number;
		fineValue?: number;
		nonComplianceFine?: number;
		maxResidents?: number;
		maxHours?: number;
		usageRules?: string;
		bookingType?: "DIARIO" | "POR_HORAS";
		openingTime?: string;
		closingTime?: string;
		items?: AmenityItem[];
		status?: "ATIVO" | "INATIVO";
	}): Promise<ApiResponse<Amenity>> {
		return apiClient.post<Amenity>(this.basePath, data);
	}

	/**
	 * Update an amenity
	 * PUT /v1/amenities/:id
	 */
	async updateAmenity(
		id: string,
		data: {
			name?: string;
			description?: string;
			type?: "COMODIDADE" | "AREA_COMUM";
			value?: number;
			fineValue?: number;
			nonComplianceFine?: number;
			maxResidents?: number;
			maxHours?: number;
			usageRules?: string;
			bookingType?: "DIARIO" | "POR_HORAS";
			openingTime?: string;
			closingTime?: string;
			items?: AmenityItem[];
			status?: "ATIVO" | "INATIVO";
		},
	): Promise<ApiResponse<Amenity>> {
		return apiClient.put<Amenity>(`${this.basePath}/${id}`, data);
	}

	/**
	 * Delete an amenity
	 * DELETE /v1/amenities/:id
	 */
	async deleteAmenity(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`${this.basePath}/${id}`);
	}

	/**
	 * Count amenities by building (returns only the number)
	 * GET /v1/amenities/count?buildingId=...
	 */
	async countAmenitiesByBuilding(buildingId: string): Promise<ApiResponse<number>> {
		return apiClient.get<number>(`${this.basePath}/count`, {
			params: {
				buildingId,
			},
		});
	}

	/**
	 * Get active commodities for resident
	 * GET /v1/amenities/resident/active
	 * Returns only amenities with status ATIVO and type COMODIDADE
	 */
	async getActiveCommoditiesForResident(): Promise<Amenity[]> {
		try {
			const response = await apiClient.get<Amenity[]>(`${this.basePath}/resident/active`);
			// O backend retorna { success, message, data: Amenity[] }
			if (response.success && response.data) {
				const amenities = Array.isArray(response.data) ? response.data : [];
				return amenities;
			}
			return [];
		} catch (error) {
			console.error("Erro ao buscar comodidades ativas:", error);
			throw error;
		}
	}
}

// Export singleton instance
export const amenitiesService = new AmenitiesService();
