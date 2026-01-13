/**
 * Financial API Service
 * Handles all financial-related API endpoints
 */

import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

/**
 * Fund entry structure (each registered fund by the admin)
 */
export interface FundEntry {
	_id: string;
	title: string;
	value: number;
	createdAt: string;
}

/**
 * Recurring expense structure
 */
export interface RecurringExpense {
	_id: string;
	name: string;
	value: number;
}

/**
 * One-time expense structure
 */
export interface OneTimeExpense {
	_id: string;
	name: string;
	description: string;
	value: number;
	receiptImageUrl?: string;
}

/**
 * Project expense structure (for projects with pending payments)
 */
export interface ProjectExpense {
	projectId: string;
	projectTitle: string;
	offerId: string;
	companyName: string;
	totalValue: number;
	installmentsCount: number;
	paidInstallments: number;
	monthlyValue: number;
}

/**
 * Financial summary response
 */
export interface FinancialSummary {
	referenceMonth: string;
	fundEntries: FundEntry[];
	condominiumFund: number;
	previousBalance: number;
	totalRecurringExpenses: number;
	totalOneTimeExpenses: number;
	totalProjectExpenses: number;
	totalExpenses: number;
	monthlyBalance: number;
	recurringExpenses: RecurringExpense[];
	oneTimeExpenses: OneTimeExpense[];
	projectExpenses: ProjectExpense[];
}

/**
 * Financial entity response
 */
export interface Financial {
	_id: string;
	buildingId: string;
	referenceMonth: string;
	fundEntries: FundEntry[];
	condominiumFund: number;
	previousBalance: number;
	recurringExpenses: RecurringExpense[];
	oneTimeExpenses: OneTimeExpense[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Financial snapshot response
 */
export interface FinancialSnapshot {
	_id: string;
	buildingId: string;
	referenceMonth: string;
	condominiumFund: number;
	previousBalance: number;
	finalBalance: number;
	totalRecurringExpenses: number;
	totalOneTimeExpenses: number;
	totalProjectExpenses: number;
	recurringExpenses: RecurringExpense[];
	oneTimeExpenses: OneTimeExpense[];
	projectExpenses: ProjectExpense[];
	createdAt: string;
}

/**
 * Month check result
 */
export interface MonthCheckResult {
	monthChanged: boolean;
	previousMonth?: string;
	currentMonth: string;
	snapshotCreated: boolean;
	installmentsUpdated: number;
}

/**
 * Add fund entry request
 */
export interface AddFundEntryRequest {
	title: string;
	value: number;
}

/**
 * Create recurring expense request
 */
export interface CreateRecurringExpenseRequest {
	name: string;
	value: number;
}

/**
 * Update recurring expense request
 */
export interface UpdateRecurringExpenseRequest {
	name?: string;
	value?: number;
}

/**
 * Create one-time expense request
 */
export interface CreateOneTimeExpenseRequest {
	name: string;
	description: string;
	value: number;
	receiptImageUrl?: string;
}

/**
 * Update one-time expense request
 */
export interface UpdateOneTimeExpenseRequest {
	name?: string;
	description?: string;
	value?: number;
	receiptImageUrl?: string;
}

/**
 * Financial Service Class
 */
class FinancialService {
	private readonly basePath = `/${API_CONFIG.version}/financial`;

	/**
	 * Check and update month (should be called when entering financial screens)
	 * GET /v1/financial/check-month
	 */
	async checkMonth(): Promise<ApiResponse<MonthCheckResult>> {
		return apiClient.get<MonthCheckResult>(`${this.basePath}/check-month`);
	}

	/**
	 * Get financial summary for current month
	 * GET /v1/financial/summary
	 */
	async getSummary(): Promise<ApiResponse<FinancialSummary>> {
		return apiClient.get<FinancialSummary>(`${this.basePath}/summary`);
	}

	/**
	 * Add fund entry to current month
	 * POST /v1/financial/fund
	 */
	async addFundEntry(data: AddFundEntryRequest): Promise<ApiResponse<Financial>> {
		return apiClient.post<Financial>(`${this.basePath}/fund`, data);
	}

	/**
	 * Add recurring expense
	 * POST /v1/financial/recurring-expenses
	 */
	async addRecurringExpense(data: CreateRecurringExpenseRequest): Promise<ApiResponse<Financial>> {
		return apiClient.post<Financial>(`${this.basePath}/recurring-expenses`, data);
	}

	/**
	 * Update recurring expense
	 * PUT /v1/financial/recurring-expenses/:id
	 */
	async updateRecurringExpense(
		expenseId: string,
		data: UpdateRecurringExpenseRequest,
	): Promise<ApiResponse<Financial>> {
		return apiClient.put<Financial>(`${this.basePath}/recurring-expenses/${expenseId}`, data);
	}

	/**
	 * Remove recurring expense
	 * DELETE /v1/financial/recurring-expenses/:id
	 */
	async removeRecurringExpense(expenseId: string): Promise<ApiResponse<Financial>> {
		return apiClient.delete<Financial>(`${this.basePath}/recurring-expenses/${expenseId}`);
	}

	/**
	 * Add one-time expense
	 * POST /v1/financial/one-time-expenses
	 */
	async addOneTimeExpense(data: CreateOneTimeExpenseRequest): Promise<ApiResponse<Financial>> {
		return apiClient.post<Financial>(`${this.basePath}/one-time-expenses`, data);
	}

	/**
	 * Update one-time expense
	 * PUT /v1/financial/one-time-expenses/:id
	 */
	async updateOneTimeExpense(
		expenseId: string,
		data: UpdateOneTimeExpenseRequest,
	): Promise<ApiResponse<Financial>> {
		return apiClient.put<Financial>(`${this.basePath}/one-time-expenses/${expenseId}`, data);
	}

	/**
	 * Remove one-time expense
	 * DELETE /v1/financial/one-time-expenses/:id
	 */
	async removeOneTimeExpense(expenseId: string): Promise<ApiResponse<Financial>> {
		return apiClient.delete<Financial>(`${this.basePath}/one-time-expenses/${expenseId}`);
	}

	/**
	 * Get financial snapshots (history)
	 * GET /v1/financial/snapshots
	 */
	async getSnapshots(): Promise<ApiResponse<FinancialSnapshot[]>> {
		return apiClient.get<FinancialSnapshot[]>(`${this.basePath}/snapshots`);
	}

	/**
	 * Get snapshot by month
	 * GET /v1/financial/snapshots/:month
	 */
	async getSnapshotByMonth(month: string): Promise<ApiResponse<FinancialSnapshot>> {
		return apiClient.get<FinancialSnapshot>(`${this.basePath}/snapshots/${month}`);
	}

	/**
	 * Get projects progress (for dashboard and progress screens)
	 * GET /v1/financial/projects-progress
	 */
	async getProjectsProgress(): Promise<ApiResponse<ProjectExpense[]>> {
		return apiClient.get<ProjectExpense[]>(`${this.basePath}/projects-progress`);
	}
}

// Export singleton instance
export const financialService = new FinancialService();
