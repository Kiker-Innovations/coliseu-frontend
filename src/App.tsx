import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AppLayoutAdmin } from "./components/layout/AppLayoutAdmin";
import { AppLayoutConcierge } from "./components/layout/AppLayoutConcierge";

// Resident pages
import Login from "./pages/resident/auth/Login";
import Register from "./pages/resident/auth/Register";
import ResetPassword from "./pages/resident/auth/ResetPassword";
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

// Concierge pages
import ConciergeLogin from "./pages/concierge/auth/Login";
import ConciergeResetPassword from "./pages/concierge/auth/ResetPassword";
import ConciergeResetPasswordToken from "./pages/concierge/auth/ResetPasswordToken";
import ConciergeDashboard from "./pages/concierge/Dashboard";
import ConciergePackages from "./pages/concierge/Packages";
import ConciergeFines from "./pages/concierge/Fines";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Resident Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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

          <Route element={<AppLayoutAdmin />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/financial" element={<AdminFinancial />} />
            <Route path="/admin/voting" element={<AdminVoting />} />
            <Route path="/admin/polls" element={<AdminPolls />} />
            <Route
              path="/admin/condominium-info"
              element={<AdminCondominiumInfo />}
            />
            <Route path="/admin/fines" element={<AdminFines />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/concierge" element={<AdminConcierge />} />
            <Route path="/admin/concierge/edit/:id" element={<AdminConciergeEdit />} />
            <Route path="/admin/concierge/view/:id" element={<AdminConciergeView />} />
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
            path="/concierge/reset-password/token"
            element={<ConciergeResetPasswordToken />}
          />

          <Route element={<AppLayoutConcierge />}>
            <Route
              path="/concierge/dashboard"
              element={<ConciergeDashboard />}
            />
            <Route path="/concierge/packages" element={<ConciergePackages />} />
            <Route path="/concierge/fines" element={<ConciergeFines />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
