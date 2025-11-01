/**
 * API Services Index
 * Central export point for all API services
 */

// Client and types
export { apiClient, ApiClientError } from "./client";
export type { ApiResponse, ApiError, RequestConfig } from "./types";

// Residents service
export { residentsService } from "./residents.service";
export type {
	ResidentRegisterRequest,
	ResidentRegisterResponse,
	Resident,
} from "./residents.service";

// Admin service
export { adminService } from "./admin.service";
export type {
	AdminLoginRequest,
	AdminLoginResponse,
	DashboardStats,
	Notice,
} from "./admin.service";

// Concierge service
export { conciergeService } from "./concierge.service";
export type {
	ConciergeLoginRequest,
	ConciergeLoginResponse,
	Package,
	PackageRegisterRequest,
	Fine,
} from "./concierge.service";
