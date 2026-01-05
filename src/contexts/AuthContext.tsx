/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  authService,
  type User,
  type UserType,
  type ResidentLoginCredentials,
  type ConciergeLoginCredentials,
  type AdminLoginCredentials,
} from "@/services/auth.service";
import { useNavigate } from "react-router-dom";

interface AuthContextData {
  user: User | null;
  userType: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginResident: (
    credentials: ResidentLoginCredentials,
    rememberMe?: boolean
  ) => Promise<void>;
  loginConcierge: (
    credentials: ConciergeLoginCredentials,
    rememberMe?: boolean
  ) => Promise<void>;
  loginAdmin: (
    credentials: AdminLoginCredentials,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  /**
   * Validate session on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const validatedUser = await authService.validateSession();
        if (validatedUser) {
          setUser(validatedUser);
          setUserType(authService.getUserType());
        }
      } catch (error) {
        console.error("Failed to validate session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Handle navigation after successful login
   */
  useEffect(() => {
    if (pendingNavigation && user && userType) {
      navigate(pendingNavigation, { replace: true });
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
  }, [pendingNavigation, user, userType, navigate]);

  /**
   * Login as Resident
   */
  const loginResident = useCallback(
    async (
      credentials: ResidentLoginCredentials,
      rememberMe = false
    ): Promise<void> => {
      const response = await authService.loginResident(credentials, rememberMe);
      setUser(response.user);
      setUserType("resident");
      setPendingNavigation("/dashboard");
    },
    []
  );

  /**
   * Login as Concierge
   */
  const loginConcierge = useCallback(
    async (
      credentials: ConciergeLoginCredentials,
      rememberMe = false
    ): Promise<void> => {
      const response = await authService.loginConcierge(
        credentials,
        rememberMe
      );
      setUser(response.user);
      setUserType("concierge");
      setPendingNavigation("/concierge/dashboard");
    },
    []
  );

  /**
   * Login as Admin
   */
  const loginAdmin = useCallback(
    async (
      credentials: AdminLoginCredentials,
      rememberMe = false
    ): Promise<void> => {
      const response = await authService.loginAdmin(credentials, rememberMe);
      setUser(response.user);
      setUserType("admin");
      setPendingNavigation("/admin/dashboard");
    },
    []
  );

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setUserType(null);
    const loginPath = authService.getLoginPath(userType);
    navigate(loginPath, { replace: true });
    window.location.href = loginPath;
  }, [navigate, userType]);

  /**
   * Validate session manually
   */
  const validateSession = useCallback(async (): Promise<void> => {
    const validatedUser = await authService.validateSession();
    if (validatedUser) {
      setUser(validatedUser);
      setUserType(authService.getUserType());
    } else {
      setUser(null);
      setUserType(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        isLoading,
        loginResident,
        loginConcierge,
        loginAdmin,
        logout,
        validateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export only the provider as default
export default AuthProvider;

// Export the context for the hook to use
export { AuthContext };
