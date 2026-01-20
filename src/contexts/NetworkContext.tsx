/**
 * Network Context
 * Provides network status throughout the application
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useNetworkStatus, type NetworkStatus } from "@/hooks/use-network-status";
import { toast } from "sonner";

interface NetworkContextData extends NetworkStatus {}

const NetworkContext = createContext<NetworkContextData | undefined>(undefined);

interface NetworkProviderProps {
	children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
	const networkStatus = useNetworkStatus();
	const wasOffline = useRef(false);
	const toastId = useRef<string | number | null>(null);

	useEffect(() => {
		if (!networkStatus.isOnline) {
			// User went offline
			wasOffline.current = true;
			toastId.current = toast.error(
				"Você está sem conexão com a internet. Verifique sua rede para continuar.",
				{
					duration: Infinity,
					id: "network-offline",
				}
			);
		} else if (wasOffline.current && networkStatus.isOnline) {
			// User came back online - just dismiss the toast silently
			wasOffline.current = false;
			if (toastId.current) {
				toast.dismiss(toastId.current);
				toastId.current = null;
			}
		}
	}, [networkStatus.isOnline]);

	return (
		<NetworkContext.Provider value={networkStatus}>
			{children}
		</NetworkContext.Provider>
	);
}

export function useNetwork(): NetworkContextData {
	const context = useContext(NetworkContext);
	if (context === undefined) {
		throw new Error("useNetwork must be used within a NetworkProvider");
	}
	return context;
}

export { NetworkContext };

