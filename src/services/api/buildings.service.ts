/**
 * Buildings Service
 * Handles building-related API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface Building {
	_id: string;
	name: string;
	cnpj: string;
	state: string;
	city: string;
	address: string;
	addressNumber: number;
	zipCode: string;
	complement?: string;
	phone: string;
	floorCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface BuildingsResponse {
	success: boolean;
	message: string;
	data: Building[];
}

class BuildingsService {
	/**
	 * Get all available buildings
	 */
	async getBuildings(): Promise<Building[]> {
		const response = await apiClient.get<Building[]>("/v1/buildings");
		return response.data || [];
	}

	/**
	 * Get building by ID
	 */
	async getBuildingById(buildingId: string): Promise<Building | null> {
		try {
			const response = await apiClient.get<Building>(`/v1/buildings/${buildingId}`);
			return response.data || null;
		} catch {
			return null;
		}
	}
}

// Export singleton instance
export const buildingsService = new BuildingsService();
