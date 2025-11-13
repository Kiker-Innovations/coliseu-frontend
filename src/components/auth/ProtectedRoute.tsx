/**
 * Protected Route Components
 * Wraps routes that require authentication and specific user types
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { UserType } from "@/services/auth.service";

interface ProtectedRouteProps {
  allowedUserType: UserType;
  redirectTo?: string;
}

/**
 * Generic Protected Route
 */
export function ProtectedRoute({
  allowedUserType,
  redirectTo,
}: ProtectedRouteProps) {
  const { isAuthenticated, userType, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    const loginPath = getLoginPath(allowedUserType);
    return <Navigate to={redirectTo || loginPath} replace />;
  }

  // Authenticated but wrong user type - redirect to correct dashboard
  if (userType !== allowedUserType) {
    const correctPath = getRedirectPath(userType);
    return <Navigate to={correctPath} replace />;
  }

  // Authenticated with correct user type - render protected content
  return <Outlet />;
}

/**
 * Protected Route for Resident
 */
export function ProtectedResidentRoute() {
  return <ProtectedRoute allowedUserType="resident" />;
}

/**
 * Protected Route for Concierge
 */
export function ProtectedConciergeRoute() {
  return <ProtectedRoute allowedUserType="concierge" />;
}

/**
 * Protected Route for Admin
 */
export function ProtectedAdminRoute() {
  return <ProtectedRoute allowedUserType="admin" />;
}

/**
 * Helper function to get login path based on user type
 */
function getLoginPath(userType: UserType | null): string {
  switch (userType) {
    case "resident":
      return "/login";
    case "concierge":
      return "/concierge/login";
    case "admin":
      return "/admin/login";
    default:
      return "/login";
  }
}

/**
 * Helper function to get redirect path based on user type
 */
function getRedirectPath(userType: UserType | null): string {
  switch (userType) {
    case "resident":
      return "/dashboard";
    case "concierge":
      return "/concierge/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}
