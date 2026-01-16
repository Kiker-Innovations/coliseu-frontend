/**
 * Useful Contact API Service
 * Handles all useful contact-related API endpoints
 */

import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Useful Contact data
 */
export interface UsefulContact {
	_id: string;
	name: string;
	phone: string;
	observation?: string;
	createdAt: string;
	updatedAt?: string;
}

/**
 * Create useful contact request
 */
export interface CreateUsefulContactRequest {
	name: string;
	phone: string;
	observation?: string;
}

/**
 * Update useful contact request
 */
export interface UpdateUsefulContactRequest {
	name?: string;
	phone?: string;
	observation?: string;
}

/**
 * Get all useful contacts
 */
export async function getUsefulContacts(): Promise<
	ApiResponse<UsefulContact[]>
> {
	return await apiClient.get<UsefulContact[]>("/v1/useful-contacts");
}

/**
 * Get useful contact by ID
 */
export async function getUsefulContactById(
	id: string,
): Promise<ApiResponse<UsefulContact>> {
	return await apiClient.get<UsefulContact>(`/v1/useful-contacts/${id}`);
}

/**
 * Create useful contact
 */
export async function createUsefulContact(
	data: CreateUsefulContactRequest,
): Promise<ApiResponse<UsefulContact>> {
	return await apiClient.post<UsefulContact>("/v1/useful-contacts", data);
}

/**
 * Update useful contact
 */
export async function updateUsefulContact(
	id: string,
	data: UpdateUsefulContactRequest,
): Promise<ApiResponse<UsefulContact>> {
	return await apiClient.put<UsefulContact>(`/v1/useful-contacts/${id}`, data);
}

/**
 * Delete useful contact
 */
export async function deleteUsefulContact(
	id: string,
): Promise<ApiResponse<void>> {
	return await apiClient.delete<void>(`/v1/useful-contacts/${id}`);
}

