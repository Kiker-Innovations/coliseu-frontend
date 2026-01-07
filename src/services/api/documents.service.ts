/**
 * Documents API Service
 * Handles all document-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Document data
 */
export interface Document {
	_id: string;
	buildingId: string;
	name: string;
	description: string;
	url: string;
	fileName: string;
	fileSize: number;
	createdAt: string;
}

/**
 * Create document request data
 */
export interface CreateDocumentRequest {
	name: string;
	description: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
}

/**
 * Create document response data
 */
export interface CreateDocumentResponse {
	_id: string;
	name: string;
	description: string;
	url: string;
	presignedUrl: string;
	createdAt: string;
}

/**
 * Update document request data
 */
export interface UpdateDocumentRequest {
	name?: string;
	description?: string;
}

/**
 * Documents Service Class
 */
class DocumentsService {
	private readonly basePath = `/${API_CONFIG.version}/documents`;

	/**
	 * Create a new document (Admin only)
	 * POST /v1/documents
	 */
	async create(data: CreateDocumentRequest): Promise<ApiResponse<CreateDocumentResponse>> {
		return apiClient.post<CreateDocumentResponse>(this.basePath, data);
	}

	/**
	 * Get all documents for the user's building
	 * GET /v1/documents
	 */
	async getAll(): Promise<ApiResponse<Document[]>> {
		return apiClient.get<Document[]>(this.basePath);
	}

	/**
	 * Get document by ID
	 * GET /v1/documents/:id
	 */
	async getById(id: string): Promise<ApiResponse<Document>> {
		return apiClient.get<Document>(`${this.basePath}/${id}`);
	}

	/**
	 * Update document (Admin only)
	 * PUT /v1/documents/:id
	 */
	async update(id: string, data: UpdateDocumentRequest): Promise<ApiResponse<Document>> {
		return apiClient.put<Document>(`${this.basePath}/${id}`, data);
	}

	/**
	 * Delete document (Admin only)
	 * DELETE /v1/documents/:id
	 */
	async delete(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`${this.basePath}/${id}`);
	}

	/**
	 * Upload document file to presigned URL
	 * This is a separate call to S3 after creating the document
	 */
	async uploadFile(presignedUrl: string, file: File): Promise<void> {
		const response = await fetch(presignedUrl, {
			method: "PUT",
			body: file,
			headers: {
				"Content-Type": file.type,
			},
		});

		if (!response.ok) {
			throw new Error("Falha ao fazer upload do arquivo");
		}
	}
}

// Export singleton instance
export const documentsService = new DocumentsService();
