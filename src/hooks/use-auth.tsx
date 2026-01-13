/**
 * Authentication Hook
 * Custom hook to access authentication context
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

/**
 * Hook to use auth context
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
