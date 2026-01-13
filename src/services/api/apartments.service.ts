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
	 * Get apartments by buildingId
	 * GET /v1/apartments?buildingId=...
	 * Uses concierge token if available (like polls)
	 */
	async getApartmentsByBuildingId(buildingId: string): Promise<Apartment[]> {
		// Ensure concierge token is set in apiClient (if available)
		const token =
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token") ||
			localStorage.getItem("concierge_token") ||
			sessionStorage.getItem("concierge_token") ||
			localStorage.getItem("coliseu_access_token") ||
			sessionStorage.getItem("coliseu_access_token");

		if (token) {
			apiClient.setAuthToken(token);
		}

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
	 * Get apartment by number and buildingId
	 * @param buildingId - The building ID
	 * @param apartmentNumber - The apartment number to search for
	 * @returns The apartment if found, null otherwise
	 */
	async getApartmentByNumberAndBuilding(
		buildingId: string,
		apartmentNumber: string,
	): Promise<Apartment | null> {
		try {
			// Use getApartmentsByBuildingId which uses query params (like polls)
			const apartments = await this.getApartmentsByBuildingId(buildingId);
			const apartment = apartments.find((apt) => apt.number === apartmentNumber);
			return apartment || null;
		} catch (error) {
			throw error;
		}
	}
}

// Export singleton instance
export const apartmentsService = new ApartmentsService();
