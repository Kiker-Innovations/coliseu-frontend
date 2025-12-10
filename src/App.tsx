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
} from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AppLayoutAdmin } from "./components/layout/AppLayoutAdmin";
import { AppLayoutConcierge } from "./components/layout/AppLayoutConcierge";

// Resident pages
import Login from "./pages/resident/auth/Login";
import Register from "./pages/resident/auth/Register";
import ResetPassword from "./pages/resident/auth/ResetPassword";
import UpdatePassword from "./pages/resident/auth/UpdatePassword";
import ConfirmCode from "./pages/resident/auth/ConfirmCode";
import Dashboard from "./pages/resident/Dashboard";
import Suggestions from "./pages/resident/Suggestions";
import Vote from "./pages/resident/Vote";
import Progress from "./pages/resident/Progress";
import Poll from "./pages/resident/Poll";
import Fines from "./pages/resident/Fines";
import Documents from "./pages/resident/Documents";
import Packages from "./pages/resident/Packages";
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
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Resident Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/confirmcode" element={<ConfirmCode />} />

            {/* Protected Resident Routes */}
            <Route element={<ProtectedResidentRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/suggestions" element={<Suggestions />} />
                <Route path="/vote" element={<Vote />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/poll" element={<Poll />} />
                <Route path="/fines" element={<Fines />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/packages" element={<Packages />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/login" replace />}
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/reset-password"
              element={<AdminResetPassword />}
            />
            <Route
              path="/admin/update-password"
              element={<AdminUpdatePassword />}
            />
            <Route path="/admin/confirmcode" element={<AdminConfirmCode />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedAdminRoute />}>
              <Route element={<AppLayoutAdmin />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/financial" element={<AdminFinancial />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/voting" element={<AdminVoting />} />
                <Route path="/admin/polls" element={<AdminPolls />} />
                <Route
                  path="/admin/condominium-info"
                  element={<AdminCondominiumInfo />}
                />
                <Route path="/admin/fines" element={<AdminFines />} />
                <Route path="/admin/notices" element={<AdminNotices />} />
                <Route path="/admin/documents" element={<AdminDocuments />} />
                <Route path="/admin/concierge" element={<AdminConcierge />} />
                <Route
                  path="/admin/concierge/edit/:id"
                  element={<AdminConciergeEdit />}
                />
                <Route
                  path="/admin/concierge/view/:id"
                  element={<AdminConciergeView />}
                />
              </Route>
            </Route>

            {/* Concierge Routes */}
            <Route
              path="/concierge"
              element={<Navigate to="/concierge/login" replace />}
            />
            <Route path="/concierge/login" element={<ConciergeLogin />} />
            <Route
              path="/concierge/reset-password"
              element={<ConciergeResetPassword />}
            />
            <Route
              path="/concierge/update-password"
              element={<ConciergeUpdatePassword />}
            />
            <Route
              path="/concierge/reset-password/token"
              element={<ConciergeResetPasswordToken />}
            />

            {/* Protected Concierge Routes */}
            <Route element={<ProtectedConciergeRoute />}>
              <Route element={<AppLayoutConcierge />}>
                <Route
                  path="/concierge/dashboard"
                  element={<ConciergeDashboard />}
                />
                <Route
                  path="/concierge/packages"
                  element={<ConciergePackages />}
                />
                <Route path="/concierge/fines" element={<ConciergeFines />} />
                <Route
                  path="/concierge/visitors"
                  element={<ConciergeVisitors />}
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
