import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Resident pages
import Login from "./pages/resident/auth/Login";
import Register from "./pages/resident/auth/Register";
import ResetPassword from "./pages/resident/auth/ResetPassword";
import UpdatePassword from "./pages/resident/auth/UpdatePassword";
import ConfirmCode from "./pages/resident/auth/ConfirmCode";
import StatusTimeline from "./pages/resident/auth/StatusTimeline";
import Dashboard from "./pages/resident/Dashboard";
import Suggestions from "./pages/resident/Suggestions";
import Vote from "./pages/resident/Vote";
import Progress from "./pages/resident/Progress";
import Poll from "./pages/resident/Poll";
import Fines from "./pages/resident/Fines";
import Documents from "./pages/resident/Documents";
import Packages from "./pages/resident/Packages";
import Bookings from "./pages/resident/Bookings";
import Notices from "./pages/resident/Notices";
import Profile from "./pages/resident/Profile";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/auth/Login";
import AdminResetPassword from "./pages/admin/auth/ResetPassword";
import AdminUpdatePassword from "./pages/admin/auth/UpdatePassword";
import AdminConfirmCode from "./pages/admin/auth/ConfirmCode";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFinancial from "./pages/admin/Financial";
import AdminVoting from "./pages/admin/Voting";
import AdminPolls from "./pages/admin/Polls";
import AdminCondominiumInfo from "./pages/admin/CondominiumInfo";
import AdminFines from "./pages/admin/Fines";
import AdminNotices from "./pages/admin/Notices";
import AdminConcierge from "./pages/admin/Concierge";
import AdminConciergeEdit from "./pages/admin/ConciergeEdit";
import AdminConciergeView from "./pages/admin/ConciergeView";
import AdminProjects from "./pages/admin/Projects";
import AdminDocuments from "./pages/admin/Documents";
import AdminProfile from "./pages/admin/Profile";

// Concierge pages
import ConciergeLogin from "./pages/concierge/auth/Login";
import ConciergeResetPassword from "./pages/concierge/auth/ResetPassword";
import ConciergeResetPasswordToken from "./pages/concierge/auth/ResetPasswordToken";
import ConciergeUpdatePassword from "./pages/concierge/auth/UpdatePassword";
import ConciergeDashboard from "./pages/concierge/Dashboard";
import ConciergePackages from "./pages/concierge/Packages";
import ConciergeFines from "./pages/concierge/Fines";
import ConciergeVisitors from "./pages/concierge/Visitors";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<AuthProvider>
					<Routes>
						<Route path="/" element={<Login />} />

						{/* Resident Routes */}
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/reset-password" element={<ResetPassword />} />
						<Route path="/update-password" element={<UpdatePassword />} />
						<Route path="/confirmcode" element={<ConfirmCode />} />
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
							</Route>
						</Route>

						{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
						<Route path="*" element={<NotFound />} />
					</Routes>
				</AuthProvider>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
