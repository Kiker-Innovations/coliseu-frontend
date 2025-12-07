/**
 * API Services Index
 * Central export point for all API services
 */

// Client and types
export { apiClient, ApiClientError } from "./client";
export type {
  ApiResponse,
  ApiError,
  RequestConfig,
  ValidationError,
} from "./types";

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
  ResidentPackage,
  GetMyPackagesParams,
  ResidentPackageStats,
  GetPackagesParams,
  ConciergePackage,
} from "./package.service";

// Season service
export {
  seasonService,
  isSeasonActive,
  isSeasonFinished,
} from "./season.service";
export type {
  TopSuggestion,
  SuggestionWithOffer,
  ChosenOffer,
  Season,
  CreateSeasonRequest,
} from "./season.service";

// Visitor service
export { visitorService } from "./visitor.service";
export type {
  CreateVisitorRequest,
  UpdateVisitorRequest,
  Visitor,
  GetVisitorsParams,
  GetVisitorsResponse,
} from "./visitor.service";

// Resident Suggestion service
export { residentSuggestionService } from "./residentSuggestion.service";
export type {
  ResidentSuggestion,
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
} from "./residentSuggestion.service";

// Visits service
export { visitsService } from "./visits.service";
export type {
  CreateVisitRequest,
  Visit,
  RecentVisit,
  GetVisitsResponse,
  GetVisitsParams,
} from "./visits.service";

// Project service
export {
  projectService,
  hasChosenOffer,
  hasActiveOfferPoll,
  isOfferPollEnded,
} from "./project.service";
export type {
  Project,
  ProjectOffer,
  CreateOfferOption,
  CreateOfferPollRequest,
  CreatedOffer,
} from "./project.service";

// Project Suggestions service
export {
  projectSuggestionsService,
  isVotingActive,
  isVotingEnded,
  hasVotingStarted,
  isWaitingForVoting,
} from "./projectSuggestions.service";
export type {
  ProjectSuggestion,
  ProjectSuggestionStatus,
  StartVotingRequest,
  CreateProjectsRequest,
  CreatedProjectFromSuggestion,
  VoteResponse,
  MyVote,
} from "./projectSuggestions.service";
