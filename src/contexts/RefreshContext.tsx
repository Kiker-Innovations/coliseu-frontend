/**
 * Refresh Context
 * Provides pull-to-refresh functionality across the application
 * Pages can register their refresh function and the layout will handle the pull gesture
 */

import {
	createContext,
	useContext,
	useCallback,
	useState,
	type ReactNode,
} from "react";
import { useNetwork } from "./NetworkContext";
import { toast } from "sonner";

interface RefreshContextData {
	/** Register a refresh function for the current page */
	registerRefresh: (refreshFn: () => Promise<void>) => void;
	/** Unregister the refresh function */
	unregisterRefresh: () => void;
	/** Execute the registered refresh function */
	executeRefresh: () => Promise<void>;
	/** Whether a refresh is currently in progress */
	isRefreshing: boolean;
	/** Whether a refresh function is registered */
	hasRefreshFunction: boolean;
}

const RefreshContext = createContext<RefreshContextData | undefined>(undefined);

interface RefreshProviderProps {
	children: ReactNode;
}

export function RefreshProvider({ children }: RefreshProviderProps) {
	const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { isOnline } = useNetwork();

	const registerRefresh = useCallback((fn: () => Promise<void>) => {
		setRefreshFn(() => fn);
	}, []);

	const unregisterRefresh = useCallback(() => {
		setRefreshFn(null);
	}, []);

	const executeRefresh = useCallback(async () => {
		if (!refreshFn) {
			return;
		}

		if (!isOnline) {
			toast.error("Sem conexão com a internet. Tente novamente quando estiver online.");
			return;
		}

		try {
			setIsRefreshing(true);
			await refreshFn();
		} catch (error) {
			console.error("Erro ao atualizar:", error);
			toast.error("Erro ao atualizar. Tente novamente.");
		} finally {
			setIsRefreshing(false);
		}
	}, [refreshFn, isOnline]);

	return (
		<RefreshContext.Provider
			value={{
				registerRefresh,
				unregisterRefresh,
				executeRefresh,
				isRefreshing,
				hasRefreshFunction: refreshFn !== null,
			}}
		>
			{children}
		</RefreshContext.Provider>
	);
}

export function useRefresh(): RefreshContextData {
	const context = useContext(RefreshContext);
	if (context === undefined) {
		throw new Error("useRefresh must be used within a RefreshProvider");
	}
	return context;
}

export { RefreshContext };

