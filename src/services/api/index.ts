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
	ResidentConfirmRequest,
	ResidentConfirmResponse,
	ResidentForgetPasswordRequest,
	ResidentForgetPasswordResponse,
	ResidentResetPasswordRequest,
	ResidentResetPasswordResponse,
	Resident,
} from "./residents.service";

// Admin service
export { adminService } from "./admin.service";
export type {
	AdminLoginRequest,
	AdminLoginResponse,
	AdminConfirmRequest,
	AdminConfirmResponse,
	AdminForgetPasswordRequest,
	AdminForgetPasswordResponse,
	AdminResetPasswordRequest,
	AdminResetPasswordResponse,
	DashboardStats,
	Notice,
} from "./admin.service";

// Concierge service
export { conciergeService } from "./concierge.service";
export type {
	ConciergeLoginRequest,
	ConciergeLoginResponse,
	ConciergeConfirmRequest,
	ConciergeConfirmResponse,
	ConciergeForgetPasswordRequest,
	ConciergeForgetPasswordResponse,
	ConciergeResetPasswordRequest,
	ConciergeResetPasswordResponse,
	PackageRegisterRequest,
	Fine,
} from "./concierge.service";

// Buildings service
export { buildingsService } from "./buildings.service";
export type { Building, BuildingsResponse } from "./buildings.service";

// Apartments service
export { apartmentsService } from "./apartments.service";
export type { Apartment } from "./apartments.service";

// Polls service
export { pollsService } from "./polls.service";
export type {
	PollOption,
	ActivePoll,
	FinishedCancelledPoll,
	CreatePollRequest,
	CreatePollResponse,
	GetPollsParams,
	GetActivePollsParams,
	GetFinishedCancelledPollsParams,
	CancelPollRequest,
	CancelPollResponse,
	VotePollRequest,
	VotePollResponse,
	GetMyVoteResponse,
} from "./polls.service";

// Package service
export { packageService } from "./package.service";
export type {
	CreatePackageRequest,
	CreatePackageResponse,
	PendingPackage,
	DeliveredPackage,
	Package,
	ConfirmDeliveryRequest,
	CancelledPackage,
	CancelPackageRequest,
	PackageStats,
} from "./package.service";

// Season service
export { seasonService, isSeasonActive, isSeasonFinished } from "./season.service";
export type {
	TopSuggestion,
	SuggestionWithOffer,
	ChosenOffer,
	OfferOption,
	CreateOfferPollRequest,
	Season,
	CreateSeasonRequest,
} from "./season.service";
