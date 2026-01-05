/**
 * Protected Route Components
 * Wraps routes that require authentication and specific user types
 */

import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate, useSearchParams } from "react-router-dom";
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

/**
 * Protected Route for Status Timeline
 * Requires a valid token in sessionStorage (set during login attempt)
 */
export function ProtectedStatusRoute({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    const validateAccess = () => {
      if (!email) {
        navigate("/login", { replace: true });
        return;
      }

      // Buscar token do sessionStorage
      const storedToken = sessionStorage.getItem(`status_access_${email}`);
      const storedTime = sessionStorage.getItem(`status_access_time_${email}`);

      if (!storedToken) {
        navigate("/login", { replace: true });
        return;
      }

      // Verificar se o token expirou (5 minutos)
      if (storedTime) {
        const tokenAge = Date.now() - parseInt(storedTime, 10);
        const fiveMinutes = 5 * 60 * 1000;

        if (tokenAge > fiveMinutes) {
          // Token expirado, limpar e redirecionar
          sessionStorage.removeItem(`status_access_${email}`);
          sessionStorage.removeItem(`status_access_time_${email}`);
          navigate("/login", { replace: true });
          return;
        }
      }

      // Se chegou aqui, o acesso é autorizado
      setIsAuthorized(true);
      setIsValidating(false);
    };

    validateAccess();
  }, [email, navigate]);

  // Mostrar loading durante validação
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  // Se não autorizado, não renderiza nada (já redirecionou)
  if (!isAuthorized) {
    return null;
  }

  // Renderizar conteúdo apenas se autorizado
  return <>{children}</>;
}