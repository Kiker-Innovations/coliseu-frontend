/**
 * Apartments API Service
 * Handles all apartment-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Apartment data
 */
export interface Apartment {
	_id: string;
	number: string;
	buildingId: string;
	floor?: number;
	block?: string;
	status?: string;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Apartments Service Class
 */
class ApartmentsService {
	private readonly basePath = `/${API_CONFIG.version}/apartments`;

	/**
	 * Get apartments by buildingId (public route, no authentication required)
	 * GET /v1/apartments?buildingId=...
	 */
	async getApartmentsByBuildingId(buildingId: string): Promise<Apartment[]> {
		const response = await apiClient.get<Apartment[]>(this.basePath, {
			params: {
				buildingId,
			},
		});
		return response.data || [];
	}

	/**
	 * Get all apartments
	 * GET /v1/apartments
	 */
	async getAllApartments(): Promise<Apartment[]> {
		const response = await apiClient.get<Apartment[]>(this.basePath);
		return response.data || [];
	}

	/**
	 * Get apartments by building (alternative endpoint)
	 * GET /v1/buildings/:buildingId/apartments
	 */
	async getApartmentsByBuilding(buildingId: string): Promise<Apartment[]> {
		const response = await apiClient.get<Apartment[]>(
			`/${API_CONFIG.version}/buildings/${buildingId}/apartments`,
		);
		return response.data || [];
	}

	/**
	 * Get apartment by number (searches in all apartments)
	 * @param apartmentNumber - The apartment number to search for
	 * @returns The apartment if found, null otherwise
	 */
	async getApartmentByNumber(apartmentNumber: string): Promise<Apartment | null> {
		try {
			const apartments = await this.getAllApartments();
			const apartment = apartments.find((apt) => apt.number === apartmentNumber);
			return apartment || null;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Get apartment by number and buildingId (legacy method)
	 * @param buildingId - The building ID
	 * @param apartmentNumber - The apartment number to search for
	 * @returns The apartment if found, null otherwise
	 */
	async getApartmentByNumberAndBuilding(
		buildingId: string,
		apartmentNumber: string,
	): Promise<Apartment | null> {
		try {
			const apartments = await this.getApartmentsByBuilding(buildingId);
			const apartment = apartments.find((apt) => apt.number === apartmentNumber);
			return apartment || null;
		} catch (error) {
			throw error;
		}
	}
}

// Export singleton instance
export const apartmentsService = new ApartmentsService();

