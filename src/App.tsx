import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import AuthProvider from "./contexts/AuthContext";
import {
	ProtectedResidentRoute,
	ProtectedConciergeRoute,
	ProtectedAdminRoute,
	ProtectedStatusRoute,
} from "./components/auth/ProtectedRoute";
import { ProtectedPageRoute } from "./components/auth/ProtectedPageRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AppLayoutAdmin } from "./components/layout/AppLayoutAdmin";
import { AppLayoutConcierge } from "./components/layout/AppLayoutConcierge";
import { InstallPrompt } from "./components/pwa/InstallPrompt";

// Resident pages
const Login = lazy(() => import("./pages/resident/auth/Login"));
const Register = lazy(() => import("./pages/resident/auth/Register"));
const ResetPassword = lazy(() => import("./pages/resident/auth/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/resident/auth/UpdatePassword"));
const StatusTimeline = lazy(() => import("./pages/resident/auth/StatusTimeline"));
const Dashboard = lazy(() => import("./pages/resident/Dashboard"));
const Suggestions = lazy(() => import("./pages/resident/Suggestions"));
const Vote = lazy(() => import("./pages/resident/Vote"));
const Progress = lazy(() => import("./pages/resident/Progress"));
const Poll = lazy(() => import("./pages/resident/Poll"));
const Fines = lazy(() => import("./pages/resident/Fines"));
const Documents = lazy(() => import("./pages/resident/Documents"));
const Packages = lazy(() => import("./pages/resident/Packages"));
const Bookings = lazy(() => import("./pages/resident/Bookings"));
const Notices = lazy(() => import("./pages/resident/Notices"));
const Profile = lazy(() => import("./pages/resident/Profile"));
const Help = lazy(() => import("./pages/resident/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/auth/Login"));
const AdminResetPassword = lazy(() => import("./pages/admin/auth/ResetPassword"));
const AdminUpdatePassword = lazy(() => import("./pages/admin/auth/UpdatePassword"));
const AdminConfirmCode = lazy(() => import("./pages/admin/auth/ConfirmCode"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminFinancial = lazy(() => import("./pages/admin/Financial"));
const AdminVoting = lazy(() => import("./pages/admin/Voting"));
const AdminPolls = lazy(() => import("./pages/admin/Polls"));
const AdminCondominiumInfo = lazy(() => import("./pages/admin/CondominiumInfo"));
const AdminFines = lazy(() => import("./pages/admin/Fines"));
const AdminNotices = lazy(() => import("./pages/admin/Notices"));
const AdminConcierge = lazy(() => import("./pages/admin/Concierge"));
const AdminConciergeEdit = lazy(() => import("./pages/admin/ConciergeEdit"));
const AdminConciergeView = lazy(() => import("./pages/admin/ConciergeView"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const AdminHelp = lazy(() => import("./pages/admin/Help"));

// Concierge pages
const ConciergeLogin = lazy(() => import("./pages/concierge/auth/Login"));
const ConciergeResetPassword = lazy(() => import("./pages/concierge/auth/ResetPassword"));
const ConciergeResetPasswordToken = lazy(
	() => import("./pages/concierge/auth/ResetPasswordToken"),
);
const ConciergeUpdatePassword = lazy(() => import("./pages/concierge/auth/UpdatePassword"));
const ConciergeDashboard = lazy(() => import("./pages/concierge/Dashboard"));
const ConciergePackages = lazy(() => import("./pages/concierge/Packages"));
const ConciergeFines = lazy(() => import("./pages/concierge/Fines"));
const ConciergeVisitors = lazy(() => import("./pages/concierge/Visitors"));
const ConciergeHelp = lazy(() => import("./pages/concierge/Help"));
const ConciergeContacts = lazy(() => import("./pages/concierge/Contacts"));

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<InstallPrompt />
			<BrowserRouter>
				<AuthProvider>
					<Suspense
						fallback={
							<div className="flex min-h-[50svh] items-center justify-center text-sm text-muted-foreground">
								Carregando...
							</div>
						}
					>
						<Routes>
							<Route path="/" element={<Login />} />

						{/* Resident Routes */}
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/reset-password" element={<ResetPassword />} />
						<Route path="/update-password" element={<UpdatePassword />} />
						<Route
							path="/status"
							element={
								<ProtectedStatusRoute>
									<StatusTimeline />
								</ProtectedStatusRoute>
							}
						/>

						{/* Protected Resident Routes */}
						<Route element={<ProtectedResidentRoute />}>
							<Route element={<AppLayout />}>
								<Route
									path="/dashboard"
									element={
										<ProtectedPageRoute>
											<Dashboard />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/suggestions"
									element={
										<ProtectedPageRoute>
											<Suggestions />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/vote"
									element={
										<ProtectedPageRoute>
											<Vote />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/progress"
									element={
										<ProtectedPageRoute>
											<Progress />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/poll"
									element={
										<ProtectedPageRoute>
											<Poll />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/fines"
									element={
										<ProtectedPageRoute>
											<Fines />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/documents"
									element={
										<ProtectedPageRoute>
											<Documents />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/packages"
									element={
										<ProtectedPageRoute>
											<Packages />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/bookings"
									element={
										<ProtectedPageRoute>
											<Bookings />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/notices"
									element={
										<ProtectedPageRoute>
											<Notices />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/profile"
									element={
										<ProtectedPageRoute>
											<Profile />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/help"
									element={
										<ProtectedPageRoute>
											<Help />
										</ProtectedPageRoute>
									}
								/>
							</Route>
						</Route>

						{/* Admin Routes */}
						<Route path="/admin" element={<Navigate to="/admin/login" replace />} />
						<Route path="/admin/login" element={<AdminLogin />} />
						<Route path="/admin/reset-password" element={<AdminResetPassword />} />
						<Route path="/admin/update-password" element={<AdminUpdatePassword />} />
						<Route path="/admin/confirmcode" element={<AdminConfirmCode />} />

						{/* Protected Admin Routes */}
						<Route element={<ProtectedAdminRoute />}>
							<Route element={<AppLayoutAdmin />}>
								<Route
									path="/admin/dashboard"
									element={
										<ProtectedPageRoute>
											<AdminDashboard />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/financial"
									element={
										<ProtectedPageRoute>
											<AdminFinancial />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/projects"
									element={
										<ProtectedPageRoute>
											<AdminProjects />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/voting"
									element={
										<ProtectedPageRoute>
											<AdminVoting />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/polls"
									element={
										<ProtectedPageRoute>
											<AdminPolls />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/condominium-info"
									element={
										<ProtectedPageRoute>
											<AdminCondominiumInfo />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/fines"
									element={
										<ProtectedPageRoute>
											<AdminFines />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/notices"
									element={
										<ProtectedPageRoute>
											<AdminNotices />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/documents"
									element={
										<ProtectedPageRoute>
											<AdminDocuments />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/concierge"
									element={
										<ProtectedPageRoute>
											<AdminConcierge />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/concierge/edit/:id"
									element={
										<ProtectedPageRoute>
											<AdminConciergeEdit />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/concierge/view/:id"
									element={
										<ProtectedPageRoute>
											<AdminConciergeView />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/profile"
									element={
										<ProtectedPageRoute>
											<AdminProfile />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/admin/help"
									element={
										<ProtectedPageRoute>
											<AdminHelp />
										</ProtectedPageRoute>
									}
								/>
							</Route>
						</Route>

						{/* Concierge Routes */}
						<Route path="/concierge" element={<Navigate to="/concierge/login" replace />} />
						<Route path="/concierge/login" element={<ConciergeLogin />} />
						<Route path="/concierge/reset-password" element={<ConciergeResetPassword />} />
						<Route path="/concierge/update-password" element={<ConciergeUpdatePassword />} />
						<Route
							path="/concierge/reset-password/token"
							element={<ConciergeResetPasswordToken />}
						/>

						{/* Protected Concierge Routes */}
						<Route element={<ProtectedConciergeRoute />}>
							<Route element={<AppLayoutConcierge />}>
								<Route
									path="/concierge/dashboard"
									element={
										<ProtectedPageRoute>
											<ConciergeDashboard />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/concierge/packages"
									element={
										<ProtectedPageRoute>
											<ConciergePackages />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/concierge/fines"
									element={
										<ProtectedPageRoute>
											<ConciergeFines />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/concierge/visitors"
									element={
										<ProtectedPageRoute>
											<ConciergeVisitors />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/concierge/contacts"
									element={
										<ProtectedPageRoute>
											<ConciergeContacts />
										</ProtectedPageRoute>
									}
								/>
								<Route
									path="/concierge/help"
									element={
										<ProtectedPageRoute>
											<ConciergeHelp />
										</ProtectedPageRoute>
									}
								/>
							</Route>
						</Route>

						{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Suspense>
				</AuthProvider>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
